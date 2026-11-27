import fs from "fs/promises";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

const createComplaintImageValidationToken = (imageBuffer, userId) => {
    if (!env.jwtAccessSecret) return null;

    const imageDigest = createHash("sha256").update(imageBuffer).digest("hex");
    return jwt.sign(
        { sub: String(userId), imageDigest },
        env.jwtAccessSecret,
        { algorithm: "HS256", expiresIn: "15m" }
    );
};

const isComplaintImageValidationTokenValid = async (file, userId, token) => {
    if (!token || !env.jwtAccessSecret) return false;

    let payload;
    try {
        payload = jwt.verify(token, env.jwtAccessSecret, {
            algorithms: ["HS256"],
        });
    } catch (error) {
        if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
            return false;
        }
        throw error;
    }

    if (
        typeof payload !== "object" ||
        payload.sub !== String(userId) ||
        typeof payload.imageDigest !== "string"
    ) {
        return false;
    }

    const imageBuffer = await fs.readFile(file.path);
    const imageDigest = createHash("sha256").update(imageBuffer).digest("hex");
    return payload.imageDigest === imageDigest;
};

// Validate complaint image using Google Gemini
const validateComplaintImage = async (file) => {
    if (!file) {
        throw new Error("Complaint image is required");
    }

    if (!env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured");
    }

    try {
        // Read uploaded image
        const imageBuffer = await fs.readFile(file.path);

        const mimeType = file.verifiedMimeType;

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedMimeTypes.includes(mimeType)) {
            throw new Error("Unsupported image format");
        }

        // Convert image into Base64
        const base64Image = imageBuffer.toString("base64");

        const prompt = `
You are an image validation assistant for Fixbee,
a college campus maintenance complaint application.

Analyze the uploaded image.

Determine whether it clearly shows a campus infrastructure
or maintenance issue.

Relevant examples:
- Water leakage
- Broken taps or pipes
- Damaged furniture
- Electrical damage
- Broken lights or fans
- Wall or ceiling damage
- Drainage problems
- Cleanliness problems
- Damaged doors or windows
- Other visible campus maintenance issues

Return exactly one JSON object:

{
  "status": "valid",
  "reason": "Short explanation"
}

OR

{
  "status": "invalid",
  "reason": "Short explanation"
}

OR

{
  "status": "uncertain",
  "reason": "Short explanation"
}

Rules:
1. Mark valid only when a relevant maintenance issue is visible.
2. Mark invalid only when the image is clearly unrelated,
   inappropriate, or unsuitable.
3. If the image is blurry, dark, ambiguous, or difficult
   to evaluate, mark uncertain.
4. Never invent damage that is not visible.
5. Do not assume ordinary objects are damaged.
6. Return JSON only. No markdown.
`;

        // Send request to Gemini
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GEMINI_API_KEY,
                },

                body: JSON.stringify({
                    model: env.GEMINI_MODEL,

                    store: false,

                    input: [
                        {
                            type: "text",
                            text: prompt,
                        },
                        {
                            type: "image",
                            data: base64Image,
                            mime_type: mimeType,
                        },
                    ],
                }),

                signal: AbortSignal.timeout(60000),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();

            console.error("Gemini API error:", errorData);

            throw new Error("Gemini image analysis failed");
        }

        const result = await response.json();

        // Extract generated text from Gemini response
        const outputText =
            result.steps
                ?.filter(step => step.type === "model_output")
                .flatMap(step => step.content || [])
                .filter(item => item.type === "text")
                .map(item => item.text)
                .join("\n") || "";

        if (!outputText) {
            console.error("Gemini returned no text:", result.status);
            throw new Error("Gemini returned an empty response");
        }

        // Parse AI response
        const analysis = JSON.parse(outputText);

        const allowedStatuses = [
            "valid",
            "invalid",
            "uncertain",
        ];

        if (!allowedStatuses.includes(analysis.status)) {
            throw new Error("Invalid Gemini response format");
        }

        if (
            typeof analysis.reason !== "string" ||
            !analysis.reason.trim()
        ) {
            throw new Error("Gemini returned an invalid reason");
        }

        return {
            status: analysis.status,
            reason: analysis.reason,
        };

    } catch (error) {
        console.error("Gemini image validation error:", error.message);

        throw error;
    }
};

// Generate complaint details using Gemini
const generateComplaintDetails = async (file, studentDescription, userId) => {
    if (!file) {
        throw new Error("Complaint image is required");
    }

    if (!studentDescription || !studentDescription.trim()) {
        throw new Error("Complaint description is required");
    }

    if (!env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured");
    }

    const imageBuffer = await fs.readFile(file.path);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = file.verifiedMimeType;

    const prompt = `
STUDENT'S COMPLAINT DESCRIPTION:

${studentDescription}

Use the student's description together with the uploaded image
to understand and evaluate the complaint.

The description provides context about issues that may not
be directly visible in a photograph.

VALIDATION RULES:

1. Accept both infrastructure repair and cleanliness complaints.
2. A complaint does not need to show broken infrastructure.
3. Dirty bathrooms, garbage accumulation and unclean areas
   are valid maintenance complaints.
4. Mark valid only when a relevant campus maintenance
   or cleanliness issue is clearly visible.
5. Mark invalid when the image is clearly unrelated
   to campus maintenance or cleanliness.
6. Mark uncertain when the image is blurry, dark,
   ambiguous or difficult to evaluate.
7. Never invent damage or cleanliness problems.
8. Do not reject an image merely because it shows
   a normal campus area; evaluate the actual visible condition.

Return exactly one JSON object:

OUTPUT INSTRUCTIONS:

Evaluate the uploaded image and the student's description together.

For a valid campus maintenance complaint, return:

{
  "status": "valid",
  "reason": "Short explanation",
  "title": "Clear complaint title",
  "description": "Detailed complaint description",
  "category": "plumbing",
  "severity": "medium"
}

SUPPORTED COMPLAINT CATEGORIES:

1. electrical
   Fans, lights, switches, wiring, power-related infrastructure.

2. plumbing
   Leaking taps, pipes, water leakage, drainage and pipelines.

3. civil
   Damaged walls, ceilings, floors, doors, windows and buildings.

4. cleaning
   Dirty classrooms, laboratories, corridors and common areas.

5. furniture
   Broken chairs, desks, benches, cupboards and other furniture.

6. water_supply
   No water supply, low pressure and water availability problems.

7. washroom
   Dirty toilets, blocked toilets, broken flushes and washroom issues.

8. waste_management
   Overflowing dustbins, garbage accumulation and waste disposal.

9. garden_outdoor
   Overgrown grass, damaged pathways and garden maintenance.

10. safety
    Exposed wires, damaged railings and visible safety hazards.

11. other
    Any genuine campus maintenance or infrastructure complaint
    that does not fit the above categories.

SEVERITY:

- low: Minor issue that does not require immediate attention.
- medium: Issue requiring maintenance attention soon.
- high: Serious issue involving safety, significant damage
  or major disruption.

IMPORTANT ACCEPTANCE RULES:

1. Accept all genuine campus maintenance, infrastructure,
   cleanliness, hygiene and safety complaints.

2. Do not restrict complaints to the examples listed above.

3. Accept complaints from classrooms, laboratories, hostels,
   bathrooms, libraries, canteens, parking areas, gardens,
   corridors and all other campus locations.

4. Use the closest matching category. If no category matches,
   use "other".

5. Do not reject a complaint simply because the issue is not
   visually obvious in the photograph.

6. Issues such as no water supply, electricity interruptions,
   bad smell or low water pressure may not be directly visible.
   If the description provides a plausible campus maintenance
   issue but the image cannot confirm it, return "uncertain".

7. Return "invalid" only when the image is clearly unrelated
   to campus maintenance, inappropriate or unsuitable.

8. Return "mismatch" only when the image shows a maintenance
   issue but clearly contradicts the student's description.

9. Never invent damage or problems that are not supported
   by the image or student's description.

10. Generate a meaningful title and description for every
   valid complaint.

11. The title must be between 5 and 120 characters.
    The description must be between 10 and 3000 characters.

12. Category must exactly match one of the supported categories.
    Severity must be low, medium or high.

For an uncertain complaint, return:

{
  "status": "uncertain",
  "reason": "Explanation"
}

For an image and description mismatch, return:

{
  "status": "mismatch",
  "reason": "Explanation"
}

For an image that is clearly unrelated or unsuitable, return:

{
  "status": "invalid",
  "reason": "Explanation"
}

Return valid JSON only. No Markdown or additional text.
`;

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY,
            },

            body: JSON.stringify({
                model: env.GEMINI_MODEL,
                store: false,

                input: [
                    {
                        type: "text",
                        text: prompt,
                    },
                    {
                        type: "image",
                        data: base64Image,
                        mime_type: mimeType,
                    },
                ],
            }),

            signal: AbortSignal.timeout(60000),
        }
    );

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Gemini API error:", errorData);

        throw new Error("Gemini complaint generation failed");
    }

    const result = await response.json();

    const outputText =
        result.steps
            ?.filter(step => step.type === "model_output")
            .flatMap(step => step.content || [])
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join("\n") || "";

    if (!outputText) {
        throw new Error("Gemini returned an empty response");
    }

    const details = JSON.parse(outputText);

    if (details.status === "mismatch") {
        return {
            status: "mismatch",
            reason: details.reason,
        };
    }

    if (details.status === "uncertain") {
        return {
            status: "uncertain",
            reason: details.reason,
        };
    }

    if (details.status === "invalid") {
        return {
            status: "invalid",
            reason: details.reason,
        };
    }

    if (details.status !== "valid") {
        throw new Error("Invalid Gemini response format");
    }

    const allowedCategories = [
        "electrical",
        "plumbing",
        "civil",
        "cleaning",
        "furniture",
        "water_supply",
        "washroom",
        "waste_management",
        "garden_outdoor",
        "safety",
        "other",
    ];

    const allowedSeverities = [
        "low",
        "medium",
        "high",
    ];

    if (
        typeof details.title !== "string" ||
        details.title.trim().length < 5 ||
        details.title.trim().length > 120
    ) {
        throw new Error("Gemini generated an invalid complaint title");
    }

    if (
        typeof details.description !== "string" ||
        details.description.trim().length < 10 ||
        details.description.trim().length > 3000
    ) {
        throw new Error("Gemini generated an invalid complaint description");
    }

    if (!allowedCategories.includes(details.category)) {
        throw new Error("Gemini generated an invalid complaint category");
    }

    if (!allowedSeverities.includes(details.severity)) {
        throw new Error("Gemini generated an invalid complaint severity");
    }

    return {
        status: "valid",
        reason: details.reason,
        title: details.title.trim(),
        description: details.description.trim(),
        category: details.category,
        severity: details.severity,
        validationToken: createComplaintImageValidationToken(imageBuffer, userId),
    };
};

export {
    validateComplaintImage,
    generateComplaintDetails,
    isComplaintImageValidationTokenValid,
};

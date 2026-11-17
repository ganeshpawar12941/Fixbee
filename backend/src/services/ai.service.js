import fs from "fs/promises";
import env from "../config/env.js";

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
const generateComplaintDetails = async (file, studentDescription) => {
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
You are Fixbee's AI complaint assistant for a college campus.

Analyze the uploaded maintenance image and the student's description.

Student's description:
"${studentDescription.trim()}"

Generate professional complaint details based ONLY on the visible
image and the information provided by the student.

Return exactly one JSON object:

{
    "title": "Short complaint title",
    "description": "Detailed professional complaint description",
    "category": "plumbing",
    "severity": "medium"
}

Allowed categories:
- electrical
- plumbing
- civil
- cleaning
- furniture
- water_supply
- other

Allowed severity:
- low
- medium
- high

Rules:
1. Never invent damage, causes, or facts.
2. Use the student's description along with visible image evidence.
3. Keep the title clear and concise.
4. Write a professional description.
5. Do not exaggerate the severity.
6. Choose the most appropriate category.
7. If the exact cause is unknown, do not assume it.
8. Return JSON only. No markdown.
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

    const allowedCategories = [
        "electrical",
        "plumbing",
        "civil",
        "cleaning",
        "furniture",
        "water_supply",
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
        title: details.title.trim(),
        description: details.description.trim(),
        category: details.category,
        severity: details.severity,
    };
};

export {
    validateComplaintImage,
    generateComplaintDetails,
};

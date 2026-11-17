import { fileTypeFromFile } from "file-type";
import { validateComplaintImage } from "./src/services/ai.service.js";

const testAI = async () => {
    try {
        const imagePath = "./test-assets/maintenance.jpeg";

        // Detect actual image type
        const detectedType = await fileTypeFromFile(imagePath);

        if (!detectedType) {
            throw new Error("Invalid image file");
        }

        const file = {
            path: imagePath,
            verifiedMimeType: detectedType.mime,
        };

        console.log("Testing Grok AI...");

        const result = await validateComplaintImage(file);

        console.log("\nAI Validation Result:");
        console.log(result);

    } catch (error) {
        console.error("\nTest failed:", error.message);
    }
};

testAI();
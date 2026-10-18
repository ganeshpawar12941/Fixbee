import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

export const uploadImage = async (
    filePath,
    folder = "fixbee"
) => {
    if (!filePath) {
        throw new ApiError(400, "Image file is required");
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "image",
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload failed:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
        });

        throw new ApiError(500, "Failed to upload image");
    }
};
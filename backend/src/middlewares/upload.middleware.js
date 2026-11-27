import multer from "multer";
import fs from "fs";
import path from "path";
import { fileTypeFromFile } from "file-type";

const uploadDirectory = path.resolve("uploads");

// Create temporary upload directory
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const allowedExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}.upload`;

        cb(null, uniqueName);
    },
});

// Initial check: verify the declared MIME type
const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error("Only JPEG, PNG, and WebP images are allowed")
        );
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

// Verify the actual file contents after Multer uploads it
export const verifyUploadedImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const detectedType = await fileTypeFromFile(req.file.path);

        if (
            !detectedType ||
            !allowedMimeTypes.includes(detectedType.mime)
        ) {
            await fs.promises.unlink(req.file.path).catch(() => { });

            return res.status(400).json({
                success: false,
                message: "The uploaded file is not a supported image.",
            });
        }

        // Store the verified MIME type for later processing
        req.file.verifiedMimeType = detectedType.mime;
        req.file.verifiedExtension =
            allowedExtensions[detectedType.mime];

        next();
    } catch (error) {
        await fs.promises.unlink(req.file.path).catch(() => { });

        next(error);
    }
};

export default upload;


import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDirectory = path.resolve("uploads");

// Create the temporary upload directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, uniqueName);
    },
});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
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

export default upload;


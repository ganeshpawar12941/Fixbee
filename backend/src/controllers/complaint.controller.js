import {
    createComplaint,
    getMyComplaints,
    getComplaintById,
    getManagementComplaints,
    addAdditionalInfo,
    updateComplaintStatus,
    ensureStudentCanSubmitComplaint,
    recordInvalidImageStrike,
    getPublicComplaintFeed,
    toggleComplaintLike,
    updateComplaint,
    deleteComplaint,
} from "../services/complaint.service.js";

import ApiResponse from "../utils/ApiResponse.js";
import { resolveComplaint } from "../services/complaint.service.js";
import asyncHandler from "../utils/asyncHandler.js";

import fs from "fs/promises";

import {
    validateComplaintImage,
    generateComplaintDetails,
} from "../services/ai.service.js";

import ApiError from "../utils/ApiError.js";

// Create a new complaint
const createComplaintController = asyncHandler(
    async (req, res) => {
        const complaint = await createComplaint(
            req.body,
            req.file,
            req.user
        );

        res.status(201).json(
            new ApiResponse(
                201,
                complaint,
                "Complaint submitted successfully"
            )
        );
    }
);

// Get the logged-in student's complaints
const getMyComplaintsController = asyncHandler(
    async (req, res) => {
        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const result = await getMyComplaints(
            req.user,
            page,
            limit
        );

        res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Your complaints fetched successfully"
            )
        );
    }
);

export const getPublicComplaintFeedController = asyncHandler(
    async (req, res) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const result = await getPublicComplaintFeed(
            req.user,
            page,
            limit,
            {
                category: req.query.category,
                locationType: req.query.locationType,
                severity: req.query.severity,
                status: req.query.status,
                search: req.query.search,
                sortBy: req.query.sortBy,
            }
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Public complaint feed fetched successfully"
            )
        );
    }
);

export const toggleComplaintLikeController = asyncHandler(
    async (req, res) => {
        const result = await toggleComplaintLike(
            req.params.id,
            req.user
        );

        const message = result.isLiked
            ? "Complaint liked successfully"
            : "Complaint unliked successfully";

        return res.status(200).json(
            new ApiResponse(200, result, message)
        );
    }
);

export const updateComplaintController = asyncHandler(
    async (req, res) => {
        const updatedComplaint = await updateComplaint(
            req.params.id,
            req.user,
            req.body
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedComplaint,
                "Complaint updated successfully"
            )
        );
    }
);

export const deleteComplaintController = asyncHandler(
    async (req, res) => {
        const result = await deleteComplaint(
            req.params.id,
            req.user
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Complaint deleted successfully"
            )
        );
    }
);

// Get one complaint
const getComplaintByIdController = asyncHandler(
    async (req, res) => {
        const complaint = await getComplaintById(
            req.params.id,
            req.user
        );

        res.status(200).json(
            new ApiResponse(
                200,
                complaint,
                "Complaint fetched successfully"
            )
        );
    }
);

// Get complaints visible to management
const getManagementComplaintsController = asyncHandler(
    async (req, res) => {
        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const result = await getManagementComplaints(
            req.user,
            page,
            limit
        );

        res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Management complaints fetched successfully"
            )
        );
    }
);

// Add additional information
const addAdditionalInfoController = asyncHandler(
    async (req, res) => {
        const { message } = req.body;

        const complaint = await addAdditionalInfo(
            req.params.id,
            message,
            req.user
        );

        res.status(200).json(
            new ApiResponse(
                200,
                complaint,
                "Additional information added successfully"
            )
        );
    }
);

export {
    createComplaintController,
    getMyComplaintsController,
    getComplaintByIdController,
    getManagementComplaintsController,
    addAdditionalInfoController,
};
export const updateComplaintStatusController = asyncHandler(
    async (req, res) => {
        const complaint = await updateComplaintStatus(
            req.params.id,
            req.body.status,
            req.user
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    complaint,
                    "Complaint status updated successfully"
                )
            );
    }
);

export const resolveComplaintController = asyncHandler(
    async (req, res) => {
        const complaint = await resolveComplaint(
            req.params.id,
            req.file,
            req.user
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                complaint,
                "Complaint resolved successfully"
            )
        );
    }
);

// Generate complaint details using AI
export const generateComplaintDetailsController = asyncHandler(
    async (req, res) => {
        const file = req.file;

        try {

            await ensureStudentCanSubmitComplaint(req.user.id);

            if (req.user.role !== "student") {
                throw new ApiError(
                    403,
                    "Only students can generate complaint details"
                );
            }

            if (!file) {
                throw new ApiError(400, "Complaint image is required");
            }

            const { description } = req.body;

            if (!description || !description.trim()) {
                throw new ApiError(
                    400,
                    "Please provide a short complaint description"
                );
            }

            // Step 1: Validate image
            const imageResult = await validateComplaintImage(file);

            if (imageResult.status === "invalid") {
                const strikeResult = await recordInvalidImageStrike(req.user.id);

                if (strikeResult.blocked) {
                    throw new ApiError(
                        403,
                        `You have submitted 4 invalid images. Your complaint submissions are blocked for 7 days, until ${strikeResult.blockedUntil.toLocaleString("en-IN")}.`
                    );
                }

                throw new ApiError(
                    400,
                    `${imageResult.reason || "Invalid complaint image"}. Warning: ${strikeResult.strikes}/4 invalid image attempts.`
                );
            }

            if (imageResult.status === "uncertain") {
                throw new ApiError(
                    422,
                    imageResult.reason || "Unable to verify this image"
                );
            }

            // Step 2: Generate complaint details
            const details = await generateComplaintDetails(
                file,
                description
            );

            if (details.status === "mismatch") {
                throw new ApiError(422, details.reason);
            }

            if (details.status === "uncertain") {
                throw new ApiError(422, details.reason);
            }

            return res.status(200).json(
                new ApiResponse(
                    200,
                    details,
                    "Complaint details generated successfully"
                )
            );

        } finally {
            // Always delete temporary uploaded image
            if (file?.path) {
                await fs.unlink(file.path).catch(() => { });
            }
        }
    }
);


import {
    createComplaint,
    getMyComplaints,
    getComplaintById,
    getManagementComplaints,
    addAdditionalInfo,
    updateComplaintStatus,
} from "../services/complaint.service.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new complaint
const createComplaintController = asyncHandler(
    async (req, res) => {
        const complaint = await createComplaint(
            req.body,
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
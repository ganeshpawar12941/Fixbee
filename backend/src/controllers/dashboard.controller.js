import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
    getStudentDashboard,
    getManagementDashboard,
} from "../services/dashboard.service.js";

// Student Dashboard
const getStudentDashboardController = asyncHandler(
    async (req, res) => {

        const dashboard = await getStudentDashboard(req.user);

        return res.status(200).json(
            new ApiResponse(
                200,
                dashboard,
                "Student dashboard fetched successfully"
            )
        );
    }
);

// Management Dashboard
const getManagementDashboardController = asyncHandler(
    async (req, res) => {

        const dashboard = await getManagementDashboard(req.user);

        return res.status(200).json(
            new ApiResponse(
                200,
                dashboard,
                "Management dashboard fetched successfully"
            )
        );
    }
);

export {
    getStudentDashboardController,
    getManagementDashboardController,
};
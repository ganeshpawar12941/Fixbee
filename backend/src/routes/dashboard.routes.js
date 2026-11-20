import { Router } from "express";

import protect from "../middlewares/auth.middleware.js";

import {
    getStudentDashboardController,
    getManagementDashboardController,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(protect);

// Student Dashboard
router.get(
    "/student",
    getStudentDashboardController
);

// Management Dashboard
router.get(
    "/management",
    getManagementDashboardController
);

export default router;
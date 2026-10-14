import { Router } from "express";

import protect from "../middlewares/auth.middleware.js";

import {
  createComplaintController,
  getMyComplaintsController,
  getComplaintByIdController,
  getManagementComplaintsController,
  addAdditionalInfoController,
} from "../controllers/complaint.controller.js";

const router = Router();

// All complaint routes require authentication
router.use(protect);

// Student routes
router.post("/", createComplaintController);
router.get("/my", getMyComplaintsController);

// Management routes
router.get("/management", getManagementComplaintsController);

// Additional information for an existing complaint
router.post("/:id/additional-info", addAdditionalInfoController);

// Get one complaint by its ID
router.get("/:id", getComplaintByIdController);

export default router;
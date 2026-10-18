import { Router } from "express";
import upload from "../middlewares/upload.middleware.js";
import protect from "../middlewares/auth.middleware.js";

import {
  createComplaintController,
  getMyComplaintsController,
  getComplaintByIdController,
  getManagementComplaintsController,
  addAdditionalInfoController,
  updateComplaintStatusController,
  resolveComplaintController,
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

router.patch("/:id/status", updateComplaintStatusController);

// Get one complaint by its ID
router.get("/:id", getComplaintByIdController);

router.patch(
  "/:id/resolve",
  upload.single("resolutionPhoto"),
  resolveComplaintController
);

export default router;
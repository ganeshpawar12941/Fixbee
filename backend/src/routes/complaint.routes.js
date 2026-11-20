import { Router } from "express";
import upload, {
  verifyUploadedImage,
} from "../middlewares/upload.middleware.js";
import protect from "../middlewares/auth.middleware.js";

import {
  createComplaintController,
  getMyComplaintsController,
  getComplaintByIdController,
  getManagementComplaintsController,
  addAdditionalInfoController,
  updateComplaintStatusController,
  resolveComplaintController,
  generateComplaintDetailsController,
  getPublicComplaintFeedController,
  toggleComplaintLikeController,
  updateComplaintController,
  deleteComplaintController,

} from "../controllers/complaint.controller.js";

const router = Router();

// All complaint routes require authentication
router.use(protect);


// Student routes

// Public complaint feed
router.get("/feed", getPublicComplaintFeedController);

// Like or unlike a complaint
router.patch("/:id/like", toggleComplaintLikeController);

router.post(
  "/generate-details",
  upload.single("complaintImage"),
  verifyUploadedImage,
  generateComplaintDetailsController
);

router.post(
  "/",
  upload.single("complaintImage"),
  verifyUploadedImage,
  createComplaintController
);

// Update own complaint
router.patch("/:id", updateComplaintController);

// Delete own complaint
router.delete("/:id", deleteComplaintController);

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
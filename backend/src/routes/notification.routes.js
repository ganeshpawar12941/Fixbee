import express from "express";

import {
    getMyNotificationsController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController,
    registerPushTokenController,
    unregisterPushTokenController,
} from "../controllers/notification.controller.js";

import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Register and unregister mobile device
router.post("/push-token", registerPushTokenController);
router.delete("/push-token", unregisterPushTokenController);


// Get logged-in user's notifications
router.get("/", getMyNotificationsController);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsReadController);

// Mark a particular notification as read
router.patch("/:id/read", markNotificationAsReadController);

export default router;
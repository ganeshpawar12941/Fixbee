import asyncHandler from "../utils/asyncHandler.js";

import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    registerPushToken,
    unregisterPushToken,
} from "../services/notification.service.js";

// Get logged-in user's notifications
export const getMyNotificationsController = asyncHandler(
    async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit) || 20)
        );

        const result = await getMyNotifications(
            req.user.id,
            page,
            limit
        );

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: result,
        });
    }
);

// Mark one notification as read
export const markNotificationAsReadController = asyncHandler(
    async (req, res) => {
        const notification = await markNotificationAsRead(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    }
);

// Mark all notifications as read
export const markAllNotificationsAsReadController = asyncHandler(
    async (req, res) => {
        await markAllNotificationsAsRead(req.user.id);

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
);

// Register device push token
export const registerPushTokenController = asyncHandler(
    async (req, res) => {
        const { token } = req.body;

        await registerPushToken(req.user.id, token);

        return res.status(200).json({
            success: true,
            message: "Push token registered successfully",
        });
    }
);

// Unregister device push token
export const unregisterPushTokenController = asyncHandler(
    async (req, res) => {
        const { token } = req.body;

        await unregisterPushToken(req.user.id, token);

        return res.status(200).json({
            success: true,
            message: "Push token removed successfully",
        });
    }
);
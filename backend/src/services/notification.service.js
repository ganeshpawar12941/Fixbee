import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

import ApiError from "../utils/ApiError.js";

import sendPushNotification from "./pushNotification.service.js";

// Validate Expo Push Token
const isValidExpoPushToken = (token) => {
    return (
        typeof token === "string" &&
        /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)
    );
};

// Register Expo Push Token
export const registerPushToken = async (userId, token) => {
    if (!isValidExpoPushToken(token)) {
        throw new ApiError(400, "Invalid Expo Push Token");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const alreadyRegistered = user.pushTokens.some(
        (device) => device.token === token
    );

    if (!alreadyRegistered) {
        user.pushTokens.push({ token });
        await user.save();
    }

    return true;
};

// Remove Expo Push Token
export const unregisterPushToken = async (userId, token) => {
    if (!isValidExpoPushToken(token)) {
        throw new ApiError(400, "Invalid Expo Push Token");
    }

    await User.updateOne(
        { _id: userId },
        {
            $pull: {
                pushTokens: { token },
            },
        }
    );

    return true;
};

// Create in-app notification
export const createNotification = async (data) => {
    const notification = await Notification.create({
        recipient: data.recipient,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedComplaint: data.relatedComplaint || null,
    });

    return notification;
};

// Create notification safely and send push notification
export const createNotificationSafely = async (data) => {
    try {
        // First create the in-app notification
        const notification = await createNotification(data);

        // Then send mobile push notification
        // Push failures must not affect the main operation
        await sendPushNotification({
            recipient: data.recipient,
            title: data.title,
            message: data.message,
            type: data.type,
            relatedComplaint: data.relatedComplaint || null,
        });

        return notification;
    } catch (error) {
        console.error(
            "Notification creation failed:",
            error.message
        );

        return null;
    }
};

// Get logged-in user's notifications
export const getMyNotifications = async (
    userId,
    page = 1,
    limit = 20
) => {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Notification.countDocuments({ recipient: userId }),

        Notification.countDocuments({
            recipient: userId,
            isRead: false,
        }),
    ]);

    return {
        notifications,
        unreadCount,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Mark a particular notification as read
export const markNotificationAsRead = async (
    notificationId,
    userId
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return notification;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
    await Notification.updateMany(
        {
            recipient: userId,
            isRead: false,
        },
        {
            $set: { isRead: true },
        }
    );

    return true;
};
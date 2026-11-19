import Notification from "../models/notification.model.js";

// Create a notification
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

// Create notification without interrupting the main operation
export const createNotificationSafely = async (data) => {
    try {
        return await createNotification(data);
    } catch (error) {
        console.error("Notification creation failed:", error.message);
        return null;
    }
};

import ApiError from "../utils/ApiError.js";

// Get logged-in user's notifications
export const getMyNotifications = async (userId, page = 1, limit = 20) => {
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
export const markNotificationAsRead = async (notificationId, userId) => {
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
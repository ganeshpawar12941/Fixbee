import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "invalid_image_warning",
                "complaint_blocked",
                "monthly_limit_reached",
                "complaint_submitted",
                "complaint_status_updated",
                "additional_info_requested",
                "complaint_resolved",
                "complaint_rejected",
            ],
            required: true,
        },

        relatedComplaint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Efficiently fetch a user's notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;
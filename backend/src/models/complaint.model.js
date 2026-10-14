
import mongoose from "mongoose";

const additionalInfoSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        senderRole: {
            type: String,
            enum: ["student", "warden", "infrastructure_dean", "admin"],
            required: true,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const complaintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 120,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 3000,
        },

        category: {
            type: String,
            enum: [
                "electrical",
                "plumbing",
                "civil",
                "cleaning",
                "furniture",
                "water_supply",
                "other",
            ],
            required: true,
        },

        imageUrl: {
            type: String,
            required: true,
        },

        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        status: {
            type: String,
            enum: [
                "submitted",
                "under_review",
                "in_progress",
                "resolved",
                "rejected",
            ],
            default: "submitted",
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        assignedManagement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        additionalInfo: {
            type: [additionalInfoSchema],
            default: [],
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
        },

        resolutionPhoto: {
            type: String,
            default: null,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ assignedManagement: 1, status: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;


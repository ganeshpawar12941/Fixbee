import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
    {
        // Complaint title
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 120,
        },

        // Complaint description
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 3000,
        },

        // Complaint location
        locationType: {
            type: String,
            enum: ["boys_hostel", "girls_hostel", "campus"],
            required: true,
        },

        // Complaint category
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

        // Uploaded complaint image URL
        imageUrl: {
            type: String,
            required: true,
        },

        // Complaint severity
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        // Complaint status
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

        // Student who submitted the complaint
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Warden, infrastructure dean, or other assigned management
        assignedManagement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Additional information provided by the student or management
        additionalInfo: [
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
                    enum: [
                        "student",
                        "warden",
                        "infrastructure_dean",
                        "admin",
                    ],
                    required: true,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Reason for rejecting a complaint
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
        },

        // Cloudinary URL of the resolution image
        resolutionPhoto: {
            type: String,
            default: null,
        },

        // Date and time when the complaint was resolved
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Database indexes
complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ assignedManagement: 1, status: 1 });

// Create and export the Complaint model
const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;

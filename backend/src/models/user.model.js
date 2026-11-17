import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        profilePicture: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            enum: ["student", "warden", "infrastructure_dean", "admin"],
            default: "student",
        },

        wardenType: {
            type: String,
            enum: ["boys_hostel", "girls_hostel", null],
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        refreshTokenHash: {
            type: String,
            default: null,
            select: false,
        },

        // Number of confirmed invalid-image attempts
        invalidImageStrikes: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Date until which complaint submissions are blocked
        complaintBlockedUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;


import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";

const MANAGEMENT_ROLES = [
    "warden",
    "infrastructure_dean",
    "admin",
];

// Check whether a user can access a complaint
const canAccessComplaint = (complaint, user) => {
    // The student who created the complaint can access it
    if (complaint.student.toString() === user.id) {
        return true;
    }

    // Admin and infrastructure dean can access all complaints
    if (
        user.role === "admin" ||
        user.role === "infrastructure_dean"
    ) {
        return true;
    }

    // A warden can access complaints assigned to them
    if (
        user.role === "warden" &&
        complaint.assignedManagement?.toString() === user.id
    ) {
        return true;
    }

    return false;
};

// Create a complaint
const createComplaint = async (data, user) => {
    if (user.role !== "student") {
        throw new ApiError(
            403,
            "Only students can submit complaints"
        );
    }

    const complaint = await Complaint.create({
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl,
        severity: data.severity || "medium",

        // Never trust the student ID supplied by the frontend
        student: user.id,
    });

    return complaint;
};

// Get complaints submitted by the logged-in student
const getMyComplaints = async (user, page = 1, limit = 10) => {
    if (user.role !== "student") {
        throw new ApiError(
            403,
            "This endpoint is only for students"
        );
    }

    const complaints = await Complaint.find({
        student: user.id,
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Complaint.countDocuments({
        student: user.id,
    });

    return {
        complaints,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Get one complaint by ID
const getComplaintById = async (complaintId, user) => {
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (!canAccessComplaint(complaint, user)) {
        throw new ApiError(
            403,
            "You are not allowed to access this complaint"
        );
    }

    return complaint;
};

// Get complaints visible to management
const getManagementComplaints = async (
    user,
    page = 1,
    limit = 10
) => {
    if (!MANAGEMENT_ROLES.includes(user.role)) {
        throw new ApiError(
            403,
            "Only management can access this endpoint"
        );
    }

    let filter = {};

    // Wardens can see complaints assigned to them
    if (user.role === "warden") {
        filter = {
            assignedManagement: user.id,
        };
    }

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Complaint.countDocuments(filter);

    return {
        complaints,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Add additional information to a complaint
const addAdditionalInfo = async (
    complaintId,
    message,
    user
) => {
    if (!message || !message.trim()) {
        throw new ApiError(
            400,
            "Additional information cannot be empty"
        );
    }

    if (message.trim().length > 1000) {
        throw new ApiError(
            400,
            "Additional information cannot exceed 1000 characters"
        );
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (!canAccessComplaint(complaint, user)) {
        throw new ApiError(
            403,
            "You are not allowed to update this complaint"
        );
    }

    if (
        complaint.status === "resolved" ||
        complaint.status === "rejected"
    ) {
        throw new ApiError(
            400,
            "You cannot add information to a closed complaint"
        );
    }

    complaint.additionalInfo.push({
        message: message.trim(),
        sender: user.id,
        senderRole: user.role,
    });

    await complaint.save();

    return complaint;
};

export {
    createComplaint,
    getMyComplaints,
    getComplaintById,
    getManagementComplaints,
    addAdditionalInfo,
};

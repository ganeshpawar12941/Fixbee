import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

const MANAGEMENT_ROLES = [
    "warden",
    "infrastructure_dean",
    "admin",
];

// Check whether a user can access a complaint

const canAccessComplaint = (complaint, user) => {
    // Student can access only their own complaints
    if (
        user.role === "student" &&
        complaint.student.toString() === user.id
    ) {
        return true;
    }

    // Admin can access all complaints
    if (user.role === "admin") {
        return true;
    }

    // Warden can access only complaints assigned to them
    if (
        user.role === "warden" &&
        complaint.assignedManagement?.toString() === user.id
    ) {
        return true;
    }

    // Infrastructure dean can access only their assigned campus complaints
    if (
        user.role === "infrastructure_dean" &&
        complaint.assignedManagement?.toString() === user.id &&
        complaint.locationType === "campus"
    ) {
        return true;
    }

    return false;
};



// Create a complaint
const createComplaint = async (data, user) => {
    if (user.role !== "student") {
        throw new ApiError(403, "Only students can create complaints");
    }

    const { title, description, category, locationType, imageUrl, severity } = data;

    if (!["boys_hostel", "girls_hostel", "campus"].includes(locationType)) {
        throw new ApiError(400, "Invalid complaint location");
    }

    let assignedManagement;

    if (locationType === "boys_hostel") {
        assignedManagement = await User.findOne({
            role: "warden",
            wardenType: "boys_hostel",
            isActive: true,
        });
    } else if (locationType === "girls_hostel") {
        assignedManagement = await User.findOne({
            role: "warden",
            wardenType: "girls_hostel",
            isActive: true,
        });
    } else {
        assignedManagement = await User.findOne({
            role: "infrastructure_dean",
            isActive: true,
        });
    }

    if (!assignedManagement) {
        throw new ApiError(
            503,
            "No active management member is configured for this complaint location"
        );
    }

    const complaint = await Complaint.create({
        title,
        description,
        category,
        locationType,
        imageUrl,
        severity: severity || "medium",
        student: user.id,
        assignedManagement: assignedManagement._id,
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

    // Wardens see only complaints assigned to them
    if (user.role === "warden") {
        filter = {
            assignedManagement: user.id,
        };
    }

    // Infrastructure dean sees only assigned campus complaints
    else if (user.role === "infrastructure_dean") {
        filter = {
            assignedManagement: user.id,
            locationType: "campus",
        };
    }

    // Admin can see all complaints

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

export const updateComplaintStatus = async (complaintId, newStatus, user) => {
    // 1. Only management can update complaint status
    const allowedRoles = ["warden", "infrastructure_dean", "admin"];

    if (!allowedRoles.includes(user.role)) {
        throw new ApiError(403, "You are not authorized to update complaint status");
    }

    // 2. Validate the requested status
    const allowedStatuses = [
        "under_review",
        "in_progress",
        "resolved",
        "rejected",
    ];

    if (!allowedStatuses.includes(newStatus)) {
        throw new ApiError(400, "Invalid complaint status");
    }

    // 3. Find the complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    // 4. Check whether this management user can access the complaint
    if (user.role === "warden") {
        if (
            !complaint.assignedManagement ||
            complaint.assignedManagement.toString() !== user.id
        ) {
            throw new ApiError(
                403,
                "You can only update complaints assigned to you"
            );
        }
    }

    // 5. Define valid status transitions
    const allowedTransitions = {
        submitted: ["under_review", "rejected"],
        under_review: ["in_progress", "rejected"],
        in_progress: ["resolved"],
        resolved: [],
        rejected: [],
    };

    // 6. Prevent invalid status changes
    if (!allowedTransitions[complaint.status]?.includes(newStatus)) {
        throw new ApiError(
            400,
            `Cannot change status from ${complaint.status} to ${newStatus}`
        );
    }

    // 7. Update the complaint
    complaint.status = newStatus;

    // Record when the complaint is resolved
    if (newStatus === "resolved") {
        complaint.resolvedAt = new Date();
    }

    await complaint.save();

    return complaint;
};
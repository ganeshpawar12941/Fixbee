import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";

const MAX_MONTHLY_COMPLAINTS = 3;

// Get Student Dashboard
const getStudentDashboard = async (user) => {
    if (user.role !== "student") {
        throw new ApiError(403, "Only students can access this dashboard");
    }

    const filter = {
        student: user.id,
        isDeleted: false,
    };

    // Calculate current Indian calendar month boundaries
    const now = new Date();

    const indiaTime = new Date(
        now.getTime() + 5.5 * 60 * 60 * 1000
    );

    const year = indiaTime.getUTCFullYear();
    const month = indiaTime.getUTCMonth();

    const monthStart = new Date(
        Date.UTC(year, month, 1) - 5.5 * 60 * 60 * 1000
    );

    const nextMonthStart = new Date(
        Date.UTC(year, month + 1, 1) - 5.5 * 60 * 60 * 1000
    );

    // Fetch dashboard information
    const [
        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        recentComplaints,
        monthlySubmitted,
    ] = await Promise.all([
        Complaint.countDocuments(filter),

        Complaint.countDocuments({
            ...filter,
            status: "submitted",
        }),

        Complaint.countDocuments({
            ...filter,
            status: "under_review",
        }),

        Complaint.countDocuments({
            ...filter,
            status: "in_progress",
        }),

        Complaint.countDocuments({
            ...filter,
            status: "resolved",
        }),

        Complaint.countDocuments({
            ...filter,
            status: "rejected",
        }),

        Complaint.find(filter)
            .select(
                "title description locationType category imageUrl severity status createdAt updatedAt statusHistory resolvedAt resolutionPhoto rejectionReason"
            )
            .sort({ createdAt: -1 })
            .limit(5),

        Complaint.countDocuments({
            student: user.id,
            createdAt: {
                $gte: monthStart,
                $lt: nextMonthStart,
            },
        }),
    ]);

    return {
        statistics: {
            totalComplaints,
            submitted,
            underReview,
            inProgress,
            resolved,
            rejected,
        },

        monthlyUsage: {
            limit: MAX_MONTHLY_COMPLAINTS,
            submitted: monthlySubmitted,
            remaining: Math.max(
                0,
                MAX_MONTHLY_COMPLAINTS - monthlySubmitted
            ),
        },

        recentComplaints,
    };
};

// Get Management Dashboard
const getManagementDashboard = async (user) => {

    const allowedRoles = [
        "warden",
        "infrastructure_dean",
        "admin",
    ];

    if (!allowedRoles.includes(user.role)) {
        throw new ApiError(
            403,
            "You are not authorized to access the management dashboard"
        );
    }

    // Base filter
    const filter = {
        isDeleted: false,
    };

    // Warden can only see complaints assigned to them
    if (user.role === "warden") {
        filter.assignedManagement = user.id;
    }

    // Infrastructure dean can only see assigned campus complaints
    if (user.role === "infrastructure_dean") {
        filter.assignedManagement = user.id;
        filter.locationType = "campus";
    }

    // Admin can see all complaints
    // No additional filter required for admin

    // Fetch dashboard information
    const [
        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        recentComplaints,
        categoryBreakdown,
        severityBreakdown,
    ] = await Promise.all([

        // Total complaints
        Complaint.countDocuments(filter),

        // Submitted
        Complaint.countDocuments({
            ...filter,
            status: "submitted",
        }),

        // Under Review
        Complaint.countDocuments({
            ...filter,
            status: "under_review",
        }),

        // In Progress
        Complaint.countDocuments({
            ...filter,
            status: "in_progress",
        }),

        // Resolved
        Complaint.countDocuments({
            ...filter,
            status: "resolved",
        }),

        // Rejected
        Complaint.countDocuments({
            ...filter,
            status: "rejected",
        }),

        // Recent complaints
        Complaint.find(filter)
            .select(
                "title description locationType category imageUrl severity status createdAt updatedAt statusHistory student assignedManagement resolvedAt resolutionPhoto rejectionReason"
            )
            .populate("student", "name profilePicture")
            .sort({ createdAt: -1 })
            .limit(5),

        // Category breakdown
        Complaint.aggregate([
            {
                $match: filter,
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),

        // Severity breakdown
        Complaint.aggregate([
            {
                $match: filter,
            },
            {
                $group: {
                    _id: "$severity",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),
    ]);

    return {
        statistics: {
            totalComplaints,
            submitted,
            underReview,
            inProgress,
            resolved,
            rejected,
        },

        categoryBreakdown,

        severityBreakdown,

        recentComplaints,
    };
};
export {
    getStudentDashboard,
    getManagementDashboard,
};
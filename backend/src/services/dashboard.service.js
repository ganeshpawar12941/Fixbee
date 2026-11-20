import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";


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

// Get Admin Analytics Dashboard
const getAdminAnalytics = async (user) => {

    // Only admin can access
    if (user.role !== "admin") {
        throw new ApiError(
            403,
            "Only administrators can access analytics"
        );
    }

    const now = new Date();

    // Calculate Indian calendar month
    const indiaTime = new Date(
        now.getTime() + 5.5 * 60 * 60 * 1000
    );

    const currentYear = indiaTime.getUTCFullYear();
    const currentMonth = indiaTime.getUTCMonth();

    // Last six months start date
    const sixMonthsStart = new Date(
        Date.UTC(currentYear, currentMonth - 5, 1)
        - 5.5 * 60 * 60 * 1000
    );

    // Generate six month keys
    const monthKeys = Array.from(
        { length: 6 },
        (_, index) => {
            const date = new Date(
                Date.UTC(
                    currentYear,
                    currentMonth - 5 + index,
                    1
                )
            );

            return `${date.getUTCFullYear()}-${String(
                date.getUTCMonth() + 1
            ).padStart(2, "0")}`;
        }
    );

    // Pending complaints older than 7 days
    const overdueDate = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const activeStatuses = [
        "submitted",
        "under_review",
        "in_progress",
    ];

    const filter = {
        isDeleted: false,
    };

    // Fetch all analytics
    const [
        totalUsers,
        activeUsers,
        totalStudents,
        totalWardens,
        totalInfrastructureDeans,
        totalAdmins,

        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,

        monthlyCreated,
        monthlyResolved,

        categoryBreakdown,
        locationBreakdown,
        severityBreakdown,

        averageResolutionTime,
        overdueComplaints,
        recentOverdueComplaints,

        studentsWithImageStrikes,
    ] = await Promise.all([

        // Total registered users
        User.countDocuments(),

        // Active users
        User.countDocuments({
            isActive: true,
        }),

        // Students
        User.countDocuments({
            role: "student",
        }),

        // Wardens
        User.countDocuments({
            role: "warden",
        }),

        // Infrastructure Dean
        User.countDocuments({
            role: "infrastructure_dean",
        }),

        // Admins
        User.countDocuments({
            role: "admin",
        }),

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

        // Complaints created each month
        Complaint.aggregate([
            {
                $match: {
                    ...filter,
                    createdAt: {
                        $gte: sixMonthsStart,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$createdAt",
                            timezone: "Asia/Kolkata",
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]),

        // Complaints resolved each month
        Complaint.aggregate([
            {
                $match: {
                    ...filter,
                    status: "resolved",
                    resolvedAt: {
                        $gte: sixMonthsStart,
                        $ne: null,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$resolvedAt",
                            timezone: "Asia/Kolkata",
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]),

        // Category breakdown
        Complaint.aggregate([
            {
                $match: filter,
            },
            {
                $group: {
                    _id: "$category",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),

        // Location breakdown
        Complaint.aggregate([
            {
                $match: filter,
            },
            {
                $group: {
                    _id: "$locationType",
                    count: {
                        $sum: 1,
                    },
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
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),

        // Average resolution time in hours
        Complaint.aggregate([
            {
                $match: {
                    ...filter,
                    status: "resolved",
                    resolvedAt: {
                        $ne: null,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageHours: {
                        $avg: {
                            $divide: [
                                {
                                    $subtract: [
                                        "$resolvedAt",
                                        "$createdAt",
                                    ],
                                },
                                1000 * 60 * 60,
                            ],
                        },
                    },
                },
            },
        ]),

        // Overdue complaint count
        Complaint.countDocuments({
            ...filter,
            status: {
                $in: activeStatuses,
            },
            createdAt: {
                $lte: overdueDate,
            },
        }),

        // Recent overdue complaints
        Complaint.find({
            ...filter,
            status: {
                $in: activeStatuses,
            },
            createdAt: {
                $lte: overdueDate,
            },
        })
            .select(
                "title category locationType severity status createdAt student assignedManagement"
            )
            .populate("student", "name profilePicture")
            .populate("assignedManagement", "name email role")
            .sort({
                createdAt: 1,
            })
            .limit(10),

        // Students who have received invalid image strikes
        User.countDocuments({
            role: "student",
            invalidImageStrikes: {
                $gt: 0,
            },
        }),
    ]);

    // Format monthly analytics
    const createdMap = new Map(
        monthlyCreated.map((item) => [
            item._id,
            item.count,
        ])
    );

    const resolvedMap = new Map(
        monthlyResolved.map((item) => [
            item._id,
            item.count,
        ])
    );

    const monthlyTrends = monthKeys.map((month) => ({
        month,

        complaintsCreated:
            createdMap.get(month) || 0,

        complaintsResolved:
            resolvedMap.get(month) || 0,
    }));

    // Average resolution time
    const averageHours =
        averageResolutionTime[0]?.averageHours ?? null;

    return {

        overview: {
            totalUsers,
            activeUsers,
            totalStudents,
            totalWardens,
            totalInfrastructureDeans,
            totalAdmins,
        },

        complaintStatistics: {
            totalComplaints,
            submitted,
            underReview,
            inProgress,
            resolved,
            rejected,

            pending:
                submitted + underReview + inProgress,

            overdue: overdueComplaints,
        },

        monthlyTrends,

        categoryBreakdown,

        locationBreakdown,

        severityBreakdown,

        resolutionPerformance: {
            averageResolutionHours:
                averageHours === null
                    ? null
                    : Number(averageHours.toFixed(2)),

            averageResolutionDays:
                averageHours === null
                    ? null
                    : Number(
                        (averageHours / 24).toFixed(2)
                    ),
        },

        imageValidationStatistics: {
            studentsWithImageStrikes,
        },

        recentOverdueComplaints,
    };
};

export {
    getStudentDashboard,
    getManagementDashboard,
    getAdminAnalytics,
};
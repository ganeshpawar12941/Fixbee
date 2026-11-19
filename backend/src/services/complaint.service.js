import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import fs from "fs/promises";
import { uploadImage } from "./cloudinary.services.js";
import { validateComplaintImage } from "./ai.service.js";
import { createNotificationSafely } from "./notification.service.js";
import { sendEmailSafely } from "./email.service.js";

const MANAGEMENT_ROLES = [
    "warden",
    "infrastructure_dean",
    "admin",
];

const MAX_INVALID_STRIKES = 4;
const BLOCK_DURATION_DAYS = 7;

const MAX_MONTHLY_COMPLAINTS = 3;


// Check monthly complaint submission limit
export const ensureMonthlyComplaintLimit = async (userId) => {
    const now = new Date();

    // Convert current time to Indian Standard Time
    const indiaTime = new Date(
        now.getTime() + (5.5 * 60 * 60 * 1000)
    );

    const year = indiaTime.getUTCFullYear();
    const month = indiaTime.getUTCMonth();

    // Start of current month in IST, converted to UTC
    const monthStart = new Date(
        Date.UTC(year, month, 1) - (5.5 * 60 * 60 * 1000)
    );

    // Start of next month in IST, converted to UTC
    const nextMonthStart = new Date(
        Date.UTC(year, month + 1, 1) - (5.5 * 60 * 60 * 1000)
    );

    const complaintCount = await Complaint.countDocuments({
        student: userId,
        createdAt: {
            $gte: monthStart,
            $lt: nextMonthStart,
        },
    });

    if (complaintCount >= MAX_MONTHLY_COMPLAINTS) {
        await createNotificationSafely({
            recipient: userId,
            title: "Monthly Complaint Limit Reached",
            message: "You have reached the maximum limit of 3 complaints this month. You can submit new complaints from the 1st of next month.",
            type: "monthly_limit_reached",
        });


        const student = await User.findById(userId);
        if (student) {
            await sendEmailSafely({
                to: student.email,
                subject: "Fixbee - Monthly Complaint Limit Reached",
                html: `
            <h2>Monthly Complaint Limit Reached</h2>

            <p>Hello ${student.name},</p>

            <p>You have reached the maximum limit of 3 complaints for this month.</p>

            <p>You can submit new complaints from:</p>

            <h3>${nextMonthStart.toLocaleDateString("en-IN")}</h3>

            <p>Until then, you can continue tracking your existing complaints and responding to additional information requests.</p>

            <br/>
            <p>Regards,<br/>Fixbee Team</p>
        `,
            });
        }
        throw new ApiError(
            403,
            "You have reached the maximum limit of 3 complaints this month. You can submit new complaints next month."
        );
    }

    // Send monthly limit email to student

};


// Check whether a student can submit complaints
export const ensureStudentCanSubmitComplaint = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const now = new Date();

    // Student is currently blocked
    if (user.complaintBlockedUntil > now) {
        throw new ApiError(
            403,
            `Your complaint submissions are blocked until ${user.complaintBlockedUntil.toLocaleString("en-IN")}`
        );
    }

    // Reset strikes after the blocking period expires
    if (
        user.complaintBlockedUntil &&
        user.complaintBlockedUntil <= now
    ) {
        user.invalidImageStrikes = 0;
        user.complaintBlockedUntil = null;

        await user.save();
    }
};

// Record a confirmed invalid image
export const recordInvalidImageStrike = async (userId) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { invalidImageStrikes: 1 } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const strikes = user.invalidImageStrikes;

    // Fourth invalid attempt: block for 7 days
    if (strikes >= MAX_INVALID_STRIKES) {
        const blockedUntil = new Date(
            Date.now() + BLOCK_DURATION_DAYS * 24 * 60 * 60 * 1000
        );

        await User.findByIdAndUpdate(userId, {
            $set: { complaintBlockedUntil: blockedUntil }
        });

        await createNotificationSafely({
            recipient: userId,
            title: "Complaint Submission Blocked",
            message: `You have submitted 4 invalid images. Your complaint submissions are blocked for 7 days, until ${blockedUntil.toLocaleString("en-IN")}.`,
            type: "complaint_blocked",
        });

        // Send block email
        await sendEmailSafely({
            to: user.email,
            subject: "Fixbee - Complaint Submission Blocked",
            html: `
                <h2>Complaint Submission Blocked</h2>
                <p>Hello ${user.name},</p>
                <p>You have submitted 4 invalid images on Fixbee.</p>
                <p>Your complaint submissions have been blocked for 7 days.</p>
                <p><strong>Block expires:</strong> ${blockedUntil.toLocaleString("en-IN")}</p>
                <p>Please ensure your future uploads clearly show campus maintenance or cleanliness issues.</p>
                <br/>
                <p>Regards,<br/>Fixbee Team</p>
            `,
        });

        return {
            strikes,
            blocked: true,
            blockedUntil,
        };
    }

    // First, second and third invalid attempts
    await createNotificationSafely({
        recipient: userId,
        title: strikes === 3 ? "Final Warning" : "Invalid Image Warning",
        message: `Your uploaded image was not valid for a campus maintenance or cleanliness complaint. This is warning ${strikes}/4. After 4 invalid image attempts, complaint submissions will be blocked for 7 days.`,
        type: "invalid_image_warning",
    });

    // Send warning email
    await sendEmailSafely({
        to: user.email,
        subject: `Fixbee - Invalid Image Warning ${strikes}/4`,
        html: `
            <h2>${strikes === 3 ? "Final Warning" : "Invalid Image Warning"}</h2>
            <p>Hello ${user.name},</p>
            <p>Your uploaded image was not valid for a campus maintenance or cleanliness complaint.</p>
            <p><strong>Warning: ${strikes}/4</strong></p>
            <p>After 4 invalid image attempts, your complaint submissions will be blocked for 7 days.</p>
            <p>Please upload genuine images showing campus maintenance or cleanliness issues.</p>
            <br/>
            <p>Regards,<br/>Fixbee Team</p>
        `,
    });

    return {
        strikes,
        blocked: false,
        blockedUntil: null,
    };
};

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
const createComplaint = async (data, file, user) => {
    if (user.role !== "student") {
        throw new ApiError(403, "Only students can create complaints");
    }

    if (!file) {
        throw new ApiError(400, "Complaint image is required");
    }

    try {

        await ensureStudentCanSubmitComplaint(user.id);

        // Check monthly complaint submission limit
        await ensureMonthlyComplaintLimit(user.id);


        // 1. Validate image using Gemini
        const aiResult = await validateComplaintImage(file);

        if (aiResult.status === "invalid") {
            const strikeResult = await recordInvalidImageStrike(user.id);

            if (strikeResult.blocked) {
                throw new ApiError(
                    403,
                    `You have submitted 4 invalid images. Your complaint submissions are blocked for 7 days, until ${strikeResult.blockedUntil.toLocaleString("en-IN")}.`
                );
            }

            throw new ApiError(
                400,
                `${aiResult.reason || "Invalid complaint image"}. Warning: ${strikeResult.strikes}/4 invalid image attempts.`
            );
        }

        if (aiResult.status === "uncertain") {
            throw new ApiError(
                422,
                "Unable to verify this image. Please capture another photo."
            );
        }

        if (aiResult.status !== "valid") {
            throw new ApiError(503, "Image validation failed");
        }

        // 2. Extract complaint details
        const {
            title,
            description,
            category,
            locationType,
            severity
        } = data;



        if (!["boys_hostel", "girls_hostel", "campus"].includes(locationType)) {
            throw new ApiError(400, "Invalid complaint location");
        }

        // 3. Find assigned management
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

        // 4. Upload validated image to Cloudinary
        const uploadedImage = await uploadImage(
            file.path,
            "fixbee/complaints"
        );

        // 5. Create complaint in MongoDB
        const complaint = await Complaint.create({
            title,
            description,
            category,
            locationType,
            imageUrl: uploadedImage.url,
            severity: severity || "medium",
            student: user.id,
            assignedManagement: assignedManagement._id,
        });

        // Notify student
        await createNotificationSafely({
            recipient: user.id,
            title: "Complaint Submitted",
            message: `Your complaint "${complaint.title}" has been submitted successfully.`,
            type: "complaint_submitted",
            relatedComplaint: complaint._id,
        });

        // Notify assigned management
        await createNotificationSafely({
            recipient: assignedManagement._id,
            title: "New Complaint Assigned",
            message: `A new ${complaint.category} complaint "${complaint.title}" has been assigned to you.`,
            type: "complaint_submitted",
            relatedComplaint: complaint._id,
        });


        // Send confirmation email to student
        await sendEmailSafely({
            to: user.email,
            subject: "Fixbee - Complaint Submitted Successfully",
            html: `
        <h2>Complaint Submitted Successfully!</h2>
        <p>Hello ${user.name},</p>
        <p>Your complaint has been successfully submitted on Fixbee.</p>

        <h3>Complaint Details</h3>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Severity:</strong> ${complaint.severity}</p>
        <p><strong>Status:</strong> ${complaint.status}</p>

        <p>You will receive updates when management reviews your complaint.</p>
        <br/>
        <p>Regards,<br/>Fixbee Team</p>
    `,
        });

        // Send new complaint email to assigned management
        await sendEmailSafely({
            to: assignedManagement.email,
            subject: "Fixbee - New Complaint Assigned",
            html: `
        <h2>New Complaint Assigned</h2>
        <p>Hello ${assignedManagement.name},</p>
        <p>A new campus maintenance or cleanliness complaint has been assigned to you.</p>

        <h3>Complaint Details</h3>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Description:</strong> ${complaint.description}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Severity:</strong> ${complaint.severity}</p>
        <p><strong>Location:</strong> ${complaint.locationType}</p>

        <p>Please log in to Fixbee to review this complaint.</p>
        <br/>
        <p>Regards,<br/>Fixbee Team</p>
    `,
        });

        return complaint;

    } finally {
        // 6. Always remove temporary image
        await fs.unlink(file.path).catch(() => { });
    }
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

    // Notify the opposite party
    let recipient;
    let notificationTitle;

    if (user.role === "student") {
        recipient = complaint.assignedManagement;
        notificationTitle = "New Additional Information";
    } else {
        recipient = complaint.student;
        notificationTitle = "Additional Information Requested";
    }

    if (recipient) {
        await createNotificationSafely({
            recipient,
            title: notificationTitle,
            message: `New information has been added to your complaint "${complaint.title}".`,
            type: "additional_info_requested",
            relatedComplaint: complaint._id,
        });
    }

    // Send email to the opposite party
    if (recipient) {
        const recipientUser = await User.findById(recipient);

        if (recipientUser) {
            await sendEmailSafely({
                to: recipientUser.email,
                subject: `Fixbee - ${notificationTitle}`,
                html: `
                <h2>${notificationTitle}</h2>

                <p>Hello ${recipientUser.name},</p>

                <p>New additional information has been added to a complaint.</p>

                <h3>Complaint Details</h3>

                <p><strong>Title:</strong> ${complaint.title}</p>
                <p><strong>Current Status:</strong> ${complaint.status}</p>

                <p>Please log in to Fixbee to view the additional information and respond if required.</p>

                <br/>
                <p>Regards,<br/>Fixbee Team</p>
            `,
            });
        }
    }

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

    // 8. Prepare notification message
    const formattedStatus = newStatus
        .replace("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase());

    let notificationType = "complaint_status_updated";
    let notificationTitle = "Complaint Status Updated";

    if (newStatus === "resolved") {
        notificationType = "complaint_resolved";
        notificationTitle = "Complaint Resolved";
    } else if (newStatus === "rejected") {
        notificationType = "complaint_rejected";
        notificationTitle = "Complaint Rejected";
    }

    // 9. Notify the student
    await createNotificationSafely({
        recipient: complaint.student,
        title: notificationTitle,
        message: `Your complaint "${complaint.title}" status has been updated to ${formattedStatus}.`,
        type: notificationType,
        relatedComplaint: complaint._id,
    });


    // 10. Send status update email to student
    const student = await User.findById(complaint.student);

    if (student) {
        await sendEmailSafely({
            to: student.email,
            subject: `Fixbee - Complaint ${formattedStatus}`,
            html: `
            <h2>Complaint Status Updated</h2>

            <p>Hello ${student.name},</p>

            <p>The status of your complaint has been updated.</p>

            <h3>Complaint Details</h3>

            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>New Status:</strong> ${formattedStatus}</p>

            <p>Please log in to Fixbee to view your complaint details.</p>

            <br/>
            <p>Regards,<br/>Fixbee Team</p>
        `,
        });
    }

    return complaint;
};

export const resolveComplaint = async (
    complaintId,
    file,
    user
) => {
    // 1. Check whether a resolution photo was uploaded
    if (!file) {
        throw new ApiError(
            400,
            "Resolution photo is required"
        );
    }

    // 2. Find the complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        await fs.unlink(file.path).catch(() => { });
        throw new ApiError(404, "Complaint not found");
    }

    // 3. Check management permissions
    if (!["warden", "infrastructure_dean", "admin"].includes(user.role)) {
        await fs.unlink(file.path).catch(() => { });
        throw new ApiError(
            403,
            "You are not authorized to resolve complaints"
        );
    }

    if (
        user.role === "warden" &&
        complaint.assignedManagement?.toString() !== user.id
    ) {
        await fs.unlink(file.path).catch(() => { });
        throw new ApiError(
            403,
            "You can only resolve complaints assigned to you"
        );
    }

    if (
        user.role === "infrastructure_dean" &&
        (
            complaint.assignedManagement?.toString() !== user.id ||
            complaint.locationType !== "campus"
        )
    ) {
        await fs.unlink(file.path).catch(() => { });
        throw new ApiError(
            403,
            "You can only resolve assigned campus complaints"
        );
    }

    // 4. Complaint must be in progress
    if (complaint.status !== "in_progress") {
        await fs.unlink(file.path).catch(() => { });
        throw new ApiError(
            400,
            "Only complaints in progress can be resolved"
        );
    }

    try {
        // 5. Upload the resolution photo to Cloudinary
        const image = await uploadImage(
            file.path,
            "fixbee/resolutions"
        );

        // 6. Update the complaint
        complaint.resolutionPhoto = image.url;
        complaint.status = "resolved";
        complaint.resolvedAt = new Date();

        await complaint.save();

        await createNotificationSafely({
            recipient: complaint.student,
            title: "Complaint Resolved",
            message: `Your complaint "${complaint.title}" has been resolved successfully. Check the complaint details to view the resolution photo.`,
            type: "complaint_resolved",
            relatedComplaint: complaint._id,
        });

        // Send resolution email to student
        const student = await User.findById(complaint.student);

        if (student) {
            await sendEmailSafely({
                to: student.email,
                subject: "Fixbee - Your Complaint Has Been Resolved",
                html: `
            <h2>Your Complaint Has Been Resolved!</h2>

            <p>Hello ${student.name},</p>

            <p>Good news! Your complaint has been resolved successfully.</p>

            <h3>Complaint Details</h3>

            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Status:</strong> Resolved</p>

            <h3>Resolution Photo</h3>

            <p>Management has uploaded a photo showing the completed resolution.</p>

            <p>
                <a href="${complaint.resolutionPhoto}">
                    View Resolution Photo
                </a>
            </p>

            <br/>
            <p>Regards,<br/>Fixbee Team</p>
        `,
            });
        }

        return complaint;
    } finally {
        // 7. Remove the temporary local file
        await fs.unlink(file.path).catch(() => { });
    }
};

import nodemailer from "nodemailer";
import env from "../config/env.js";

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD,
    },
});

// Send an email
export const sendEmail = async ({ to, subject, html }) => {
    const result = await transporter.sendMail({
        from: `"Fixbee Notifications" <${env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });

    return result;
};

// Send email safely without interrupting main operations
export const sendEmailSafely = async (emailData) => {
    try {
        return await sendEmail(emailData);
    } catch (error) {
        console.error("Email sending failed:", error.message);
        return null;
    }
};
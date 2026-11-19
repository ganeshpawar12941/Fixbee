import "dotenv/config";

import  {sendEmail}  from "./src/services/email.service.js";

const testEmail = async () => {
    try {
        await sendEmail({
            to: process.env.EMAIL_USER,

            subject: "Fixbee Email Test",

            html: `
                <h2>Welcome to Fixbee!</h2>
                <p>Your email notification system is working successfully.</p>
                <p>This is a test email from the Fixbee backend.</p>
            `,
        });

        console.log("Test email sent successfully!");
    } catch (error) {
        console.error("Email test failed:", error.message);
    }
};

testEmail();
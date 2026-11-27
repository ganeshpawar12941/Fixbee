import User from "../models/user.model.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Send push notifications to a user's registered devices
const sendPushNotification = async ({
    recipient,
    title,
    message,
    type,
    relatedComplaint = null,
}) => {
    try {
        const user = await User.findById(recipient).select("pushTokens");

        if (!user || !user.pushTokens.length) {
            return;
        }

        const messages = user.pushTokens.map((device) => ({
            to: device.token,
            sound: "default",
            title,
            body: message,
            priority: "high",
            channelId: "default",
            data: {
                type,
                relatedComplaint: relatedComplaint
                    ? relatedComplaint.toString()
                    : null,
            },
        }));

        const headers = {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
        };

        // Optional Expo access token
        if (process.env.EXPO_ACCESS_TOKEN) {
            headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
        }

        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(messages),
        });

        if (!response.ok) {
            throw new Error(
                `Expo Push API failed with status ${response.status}`
            );
        }

        const result = await response.json();

        // Remove tokens that Expo reports as invalid
        const invalidTokens = [];

        result.data?.forEach((ticket, index) => {
            if (
                ticket.status === "error" &&
                ticket.details?.error === "DeviceNotRegistered"
            ) {
                invalidTokens.push(messages[index].to);
            }
        });

        if (invalidTokens.length > 0) {
            await User.updateOne(
                { _id: recipient },
                {
                    $pull: {
                        pushTokens: {
                            token: { $in: invalidTokens },
                        },
                    },
                }
            );
        }

        return result;
    } catch (error) {
        console.error(
            "Push notification failed:",
            error.message
        );

        return null;
    }
};

export default sendPushNotification;
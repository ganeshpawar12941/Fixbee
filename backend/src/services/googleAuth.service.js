import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

const client = new OAuth2Client(env.googleClientId);

/**
 * Verify a Google ID token and find-or-create the matching user.
 * Enforces the college email-domain restriction.
 *
 * @param {string} idToken  - Raw Google ID token from the client
 * @returns {Promise<{ id: string, name: string, email: string, role: string }>}
 */
async function authenticateWithGoogle(idToken) {
    // 1. Verify the token with Google.
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken,
            audience: env.googleClientId,
        });
    } catch {
        throw new ApiError(401, "Invalid Google ID token");
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 2. Enforce college email domain.
    if (!email.endsWith(`@${env.collegeEmailDomain}`)) {
        throw new ApiError(
            403,
            `Only ${env.collegeEmailDomain} accounts are allowed`
        );
    }

    // 3. Find or create the user document.
    let user = await User.findOne({ googleId });

    if (!user) {
        user = await User.create({
            googleId,
            email,
            name,
            profilePicture: picture || "",
        });
    }

    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated");
    }

    // Update last login timestamp.
    user.lastLoginAt = new Date();
    await user.save();

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
    };
}

export default authenticateWithGoogle;

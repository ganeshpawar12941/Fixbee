import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

const client = new OAuth2Client();

/**
 * Verify a Google ID token and find-or-create the matching user.
 * Enforces the college email-domain restriction.
 *
 * @param {string} idToken  - Raw Google ID token from the client
 * @returns {Promise<{ id: string, name: string, email: string, role: string }>}
 */
async function authenticateWithGoogle(idToken) {
    const acceptedAudiences = env.googleClientIds.length
        ? env.googleClientIds
        : (env.googleClientId ? [env.googleClientId] : []);

    if (acceptedAudiences.length === 0) {
        throw new ApiError(
            503,
            "Google OAuth is not configured on the server"
        );
    }

    // 1. Verify the token with Google.
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken,
            audience: acceptedAudiences,
        });
    } catch {
        throw new ApiError(401, "Invalid Google ID token");
    }

    const payload = ticket.getPayload();
    const {
        sub: googleId,
        email,
        email_verified: emailVerified,
        name,
        picture,
    } = payload || {};

    if (!googleId || !email || !emailVerified) {
        throw new ApiError(401, "Google account must provide a verified email");
    }

    const normalizedEmail = email.toLowerCase();

    // 2. Enforce college email domain.
    if (!normalizedEmail.endsWith(`@${env.collegeEmailDomain.toLowerCase()}`)) {
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
            email: normalizedEmail,
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

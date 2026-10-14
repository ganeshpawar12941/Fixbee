import { verifyAccessToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Middleware that validates the Bearer access token attached to a request.
 * On success, it attaches the full user document to `req.user`.
 * On failure, it throws an ApiError with the appropriate HTTP status.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization token missing");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch {
        throw new ApiError(401, "Invalid or expired access token");
    }

    if (!decoded.sub || decoded.type !== "access") {
        throw new ApiError(401, "Invalid token payload");
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
        throw new ApiError(401, "User account is unavailable");
    }

    req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
    };

    next();
});

export default authenticate;

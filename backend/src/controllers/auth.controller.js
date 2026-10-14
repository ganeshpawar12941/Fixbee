import User from "../models/user.model.js";
import authenticateWithGoogle from "../services/auth.service.js";

import {
    generateTokenPair,
    verifyRefreshToken,
    hashRefreshToken,
} from "../services/jwt.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "Google ID token is required");
    }

    // Verify Google identity and find or create the user.
    const user = await authenticateWithGoogle(idToken);

    // Generate application tokens.
    const tokens = generateTokenPair(user);

    // Save the hash of the refresh token.
    await User.findByIdAndUpdate(user.id, {
        refreshTokenHash: hashRefreshToken(tokens.refreshToken),
    });

    return res.status(200).json(
        new ApiResponse(200, "Login successful", {
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        })
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, "User profile retrieved successfully", {
            user: req.user,
        })
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    if (!decoded.sub || decoded.type !== "refresh") {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decoded.sub).select("+refreshTokenHash");

    if (!user || !user.isActive) {
        throw new ApiError(401, "User account is unavailable");
    }

    const suppliedTokenHash = hashRefreshToken(refreshToken);

    if (user.refreshTokenHash !== suppliedTokenHash) {
        throw new ApiError(401, "Refresh token is no longer valid");
    }

    // Rotate the refresh token after successful verification.
    const safeUser = {
        id: user._id.toString(),
        role: user.role,
    };

    const tokens = generateTokenPair(safeUser);

    user.refreshTokenHash = hashRefreshToken(tokens.refreshToken);
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, "Token refreshed successfully", {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        })
    );
});

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, {
        $unset: {
            refreshTokenHash: 1,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, "Logout successful", null)
    );
});

export {
    googleLogin,
    getCurrentUser,
    refreshAccessToken,
    logout,
};
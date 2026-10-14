import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";

/**
 * Generate an access token and a refresh token for the given user payload.
 * @param {{ id: string, role: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateTokenPair(user) {
    const payload = { sub: user.id, role: user.role, type: "access" };

    const accessToken = jwt.sign(payload, env.jwtAccessSecret, {
        expiresIn: env.jwtAccessExpiresIn,
    });

    const refreshToken = jwt.sign(
        { sub: user.id, role: user.role, type: "refresh" },
        env.jwtRefreshSecret,
        { expiresIn: env.jwtRefreshExpiresIn }
    );

    return { accessToken, refreshToken };
}

/**
 * Verify an access token and return its decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, env.jwtAccessSecret);
}

/**
 * Verify a refresh token and return its decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.jwtRefreshSecret);
}

/**
 * Create a SHA-256 hash of a refresh token for safe storage.
 * @param {string} token
 * @returns {string} hex digest
 */
export function hashRefreshToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

import { Router } from "express";
import {
    googleLogin,
    getCurrentUser,
    refreshAccessToken,
    logout,
} from "../controllers/auth.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * POST /api/v1/auth/google
 * Exchange a Google ID token for application access + refresh tokens.
 */
router.post("/google", googleLogin);

/**
 * POST /api/v1/auth/refresh
 * Rotate the refresh token and issue a new access token.
 */
router.post("/refresh", refreshAccessToken);

/**
 * GET /api/v1/auth/me
 * Return the authenticated user's profile.
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * POST /api/v1/auth/logout
 * Invalidate the refresh token stored in the database.
 */
router.post("/logout", authenticate, logout);

export default router;

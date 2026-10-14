import { Router } from "express";
import ApiResponse from "../utils/ApiResponse.js";

const router = Router();

/**
 * Health-check / root endpoint.
 * GET /api/v1/health
 */
router.get("/health", (_req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { uptime: process.uptime() }, "FixBee API is healthy 🐝"));
});

/**
 * Mount feature routers below as the project grows, e.g.
 *
 * import authRoutes  from "./auth.routes.js";
 * import userRoutes  from "./user.routes.js";
 *
 * router.use("/auth",  authRoutes);
 * router.use("/users", userRoutes);
 */

export default router;

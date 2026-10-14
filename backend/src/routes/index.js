import { Router } from "express";
import ApiResponse from "../utils/ApiResponse.js";
import authRoutes from "./auth.routes.js";

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

router.use("/auth", authRoutes);


export default router;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import env from "./config/env.js";
import router from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ─── Security ──────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── HTTP Logging ────────────────────────────────────────────────────────────
app.use(pinoHttp({ level: env.LOG_LEVEL }));

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/v1", router);

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
// Order matters: notFound must come before errorHandler
app.use(notFound);
app.use(errorHandler);

export default app;

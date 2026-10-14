import "dotenv/config";

/**
 * Central configuration object built from environment variables.
 * All env vars should be accessed through this module — never directly via process.env.
 */
const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/fixbee",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Helpers
  isDev: (process.env.NODE_ENV || "development") === "development",
  isProd: process.env.NODE_ENV === "production",

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  collegeEmailDomain: process.env.COLLEGE_EMAIL_DOMAIN || "students.git.edu",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export default env;

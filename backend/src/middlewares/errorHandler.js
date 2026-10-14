import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

/**
 * Global error-handling middleware.
 * Must be the LAST middleware registered in app.js (4-argument signature).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Normalise to ApiError
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ?? 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(env.isDev && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;

import ApiError from "../utils/ApiError.js";

/**
 * Catch-all middleware for undefined routes.
 * Registered AFTER all valid routes so it only fires for unmatched paths.
 */
const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;

/**
 * Wraps an async Express route handler and forwards any rejection
 * to the next() error middleware — eliminates try/catch boilerplate.
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function}  Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

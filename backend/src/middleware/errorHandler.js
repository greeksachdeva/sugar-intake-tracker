/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a consistent error response format.
 *
 * Error Response Format:
 * {
 *   "success": false,
 *   "error": {
 *     "message": "...",
 *     "details": [...]
 *   }
 * }
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Log the error server-side for debugging
  console.error('Unhandled error:', err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate entry',
        details: ['A record with this key already exists'],
      },
    });
  }

  // JSON parse errors (malformed body)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON',
        details: ['Request body contains invalid JSON'],
      },
    });
  }

  // Default: internal server error — don't expose internals
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: err.details || [],
    },
  });
}

module.exports = errorHandler;

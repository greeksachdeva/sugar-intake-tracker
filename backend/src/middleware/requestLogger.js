/**
 * Request logging middleware.
 * Logs method, URL, status code, and response time for every request.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Listen for the response finish event to capture status code and timing
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}

module.exports = requestLogger;

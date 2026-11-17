const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${statusCode} - ${message}`);
  if (err.stack && process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};
module.exports = {
  errorHandler,
  notFoundHandler,
};

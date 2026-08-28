const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || 500;

  const message = error.message || "Something went wrong";

  res.status(status).json({
    message,

    error: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

export default errorHandler;

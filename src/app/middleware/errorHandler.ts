import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  //Handle invalide BSON / MongoDB ObjectId format error
  if (
    err.name === "BSONError" ||
    err.message?.includes("input must be a 24-character hex string")
  ) {
    statusCode = 400;
    message = "Invalid MongoDB ObjectId format";
  }

  //Handle JSON parsing error in request body
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON format in request body";
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

import type { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiError";
import { NODE_ENV } from "../config/config";

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(new apiError(404, `route ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof apiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }
  console.error("unexpected error", err);
  res.status(500).json({
    success: false,
    message: "internal server error",
    ...(NODE_ENV === "development" && { debug: String(err) }),
  });
}

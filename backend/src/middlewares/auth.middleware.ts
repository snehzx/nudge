import type { NextFunction, Request, Response } from "express";
import { apiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/jwt.ts";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    return next(new apiError(401, "invalid token"));
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(new apiError(401, "invalid or missing token"));
  }
}

import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { apiError } from "../utils/apiError.ts";
import * as authService from "../services/auth.service.ts";
import { NODE_ENV } from "../config/config.ts";

const refreshCookie = {
  httpOnly: true,
  secure: NODE_ENV === "production", //true for https optional for dev env
  sameSite: "lax" as const, //controls whether cookie is sent on cross-site requests . strict is tighter but for local dev it can block so lax
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.signup(
    req.body,
  );
  res.cookie("refreshToken", refreshToken, refreshCookie);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.signin(
    req.body,
  );
  res.cookie("refreshToken", refreshToken, refreshCookie);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new apiError(401, "no refresh token");

  const { accessToken, refreshToken } = await authService.refresh(token);
  res.cookie("refreshToken", refreshToken, refreshCookie);
  res.status(200).json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.sub);
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  res.status(200).json({ success: true, data: null });
});

export const me = asyncHandler(async (req: Request, res: Response) => [
  res.status(200).json({ success: true, data: { user: req.user } }),
]);

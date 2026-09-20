import jwt, { type SignOptions } from "jsonwebtoken";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "../config/config";

export type accessPayload = { sub: string; username: string };

export function signAccessToken(payload: accessPayload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: { sub: string }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
  });
}
export function verifyAccessToken(token: string): accessPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as accessPayload;
}

export function verifyRefreshToken(token: string): accessPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as accessPayload;
}

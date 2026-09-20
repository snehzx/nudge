import bcrypt from "bcrypt";
import { User } from "../models/user.model.ts";
import { apiError } from "../utils/apiError.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";
import type { SigninInput, SignupInput } from "../validator/auth.validator.ts";

async function issueTokens(userId: string, username: string) {
  const accessToken = signAccessToken({ sub: userId, username });
  const refreshToken = signRefreshToken({ sub: userId });

  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: await bcrypt.hash(refreshToken, 10),
  });

  return { accessToken, refreshToken };
}

export async function signup(input: SignupInput) {
  const exists = await User.findOne({
    $or: [{ email: input.email }, { username: input.username }],
  });
  if (exists) throw new apiError(409, "email or username already exists");

  const user = await User.create(input);
  const tokens = await issueTokens(user._id.toString(), user.username);

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    ...tokens,
  };
}

export async function signin(input: SigninInput) {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user) throw new apiError(401, "invalid creds");

  const ok = await user.comparePassword(input.password);
  if (!ok) throw new apiError(401, "Invalid creds");

  const tokens = await issueTokens(user._id.toString(), user.username);
  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    ...tokens,
  };
}

export async function refresh(token: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw new apiError(401, "Invalid refresh token");
  }
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user?.refreshTokenHash) throw new apiError(401, "session revoked");

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) throw new apiError(401, "session revoked");

  return issueTokens(user._id.toString(), user.username);
}

export async function logout(userId: string) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

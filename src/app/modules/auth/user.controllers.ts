import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/apiError.js";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "./user.service.js";

import type { AuthRequest } from "./user.type.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
};

const setRefreshCookie = (
  res: any,
  token: string,
  expiresAt: Date
) => {
  res.cookie("refreshToken", token, {
    ...cookieOptions,
    expires: expiresAt,
  });
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshExpiresAt
  );

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshExpiresAt
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const result = await refreshAccessToken(refreshToken);

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshExpiresAt
  );

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const sessionId = (req as AuthRequest).sessionId;

  if (!sessionId) {
    throw new ApiError(401, "Authentication required");
  }

  await logoutUser(sessionId);

  res.clearCookie("refreshToken", {
    ...cookieOptions,
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user;

  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler } from "express";

import { getDB } from "../../../config/db.js";
import { ApiError } from "../../../utils/apiError.js";
import config from "../../../config/config.js";

import type {
  UserDocument,
  PublicUser,
  RegisterInput,
  LoginInput,
  AuthRequest,
  RefreshSession,
} from "./user.type.js";

const getUsersCollection = () =>
  getDB().collection<UserDocument>("users");

const getSessionsCollection = () =>
  getDB().collection<RefreshSession>("refreshSessions");

const getJWTSecret = (): string => {
  const secret = config.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

const formatUser = (
  user: UserDocument & { _id: ObjectId }
): PublicUser => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// Refresh Token Hash
const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

// Access Token
const generateAccessToken = (
  userId: ObjectId,
  sessionId: ObjectId
): string => {
  return jwt.sign(
    {
      id: userId.toString(),
      sid: sessionId.toString(),
    },
    getJWTSecret(),
    { expiresIn: "15m" }
  );
};

// Refresh Token
const generateRefreshToken = (): string => {
  return randomBytes(64).toString("hex");
};

// New Session
const createSession = async (userId: ObjectId) => {
  const now = new Date();

  const absoluteExpiresAt = new Date(
    now.getTime() + 15 * 24 * 60 * 60 * 1000
  );

  const expiresAt = new Date(
    Math.min(
      now.getTime() + 2 * 24 * 60 * 60 * 1000,
      absoluteExpiresAt.getTime()
    )
  );

  const refreshToken = generateRefreshToken();

  const session: RefreshSession = {
    userId,
    refreshTokenHash: hashToken(refreshToken),
    createdAt: now,
    expiresAt,
    absoluteExpiresAt,
    revokedAt: null,
  };

  const result = await getSessionsCollection().insertOne(session);

  const sessionId = result.insertedId;

  const accessToken = generateAccessToken(userId, sessionId);

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
    sessionId,
  };
};


export const registerUser = async (data: RegisterInput) => {
  const { name, email, password } = data;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await getUsersCollection().findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  if (data.role && data.role !== "customer") {
    throw new ApiError(403, "Admin authorization required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser: UserDocument = {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "customer",
    createdAt: new Date(),
  };

  const result = await getUsersCollection().insertOne(newUser);

  const createdUser = await getUsersCollection().findOne({
    _id: result.insertedId,
  });

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  const session = await createSession(result.insertedId);

  return {
    user: formatUser(createdUser),
    ...session,
  };
};

// Login
export const loginUser = async (data: LoginInput) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await getUsersCollection().findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    throw new ApiError(401, "Invalid email or password");
  }

  const session = await createSession(user._id);

  return {
    user: formatUser(user),
    ...session,
  };
};

// Refresh Token Rotation
export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  const tokenHash = hashToken(refreshToken);

  const session = await getSessionsCollection().findOne({
    refreshTokenHash: tokenHash,
  });

  if (!session) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const now = new Date();

  if (
    session.revokedAt ||
    session.expiresAt <= now ||
    session.absoluteExpiresAt <= now
  ) {
    throw new ApiError(401, "Refresh session expired or revoked");
  }

  const user = await getUsersCollection().findOne({
    _id: session.userId,
  });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const newRefreshToken = generateRefreshToken();

  const newExpiresAt = new Date(
    Math.min(
      now.getTime() + 2 * 24 * 60 * 60 * 1000,
      session.absoluteExpiresAt.getTime()
    )
  );

  const rotation = await getSessionsCollection().updateOne(
    {
      _id: session._id,
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
      absoluteExpiresAt: { $gt: now },
    },
    {
      $set: {
        refreshTokenHash: hashToken(newRefreshToken),
        expiresAt: newExpiresAt,
      },
    }
  );

  if (rotation.modifiedCount !== 1) {
    await getSessionsCollection().updateOne(
      { _id: session._id, revokedAt: null },
      { $set: { revokedAt: now } }
    );

    throw new ApiError(401, "Refresh token reuse detected");
  }

  const accessToken = generateAccessToken(
    user._id,
    session._id!
  );

  return {
    user: formatUser(user),
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt: newExpiresAt,
  };
};

export const logoutUser = async (sessionId: ObjectId) => {
  await getSessionsCollection().updateOne(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
};

// Access Token Authentication Middleware
export const authenticateToken: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token required");
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Invalid authorization token");
    }

    let decoded: string | JwtPayload;

    try {
      decoded = jwt.verify(token, getJWTSecret());
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }

    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      typeof decoded.sid !== "string" ||
      !ObjectId.isValid(decoded.id) ||
      !ObjectId.isValid(decoded.sid)
    ) {
      throw new ApiError(401, "Invalid token payload");
    }

    const userId = new ObjectId(decoded.id);
    const sessionId = new ObjectId(decoded.sid);

    const session = await getSessionsCollection().findOne({
      _id: sessionId,
      userId,
      revokedAt: null,
      absoluteExpiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new ApiError(401, "Session expired or revoked");
    }

    const user = await getUsersCollection().findOne({
      _id: userId,
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    (req as AuthRequest).user = formatUser(user);
    (req as AuthRequest).sessionId = sessionId;

    next();
  } catch (error) {
    next(error);
  }
};
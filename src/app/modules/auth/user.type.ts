import type { ObjectId } from "mongodb";
import type { Request } from "express";

export type UserRole = "customer" | "moderator" | "admin";

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface PublicUser {
  _id: ObjectId;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshSession {
  _id?: ObjectId;
  userId: ObjectId;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
}

export interface AuthRequest extends Request {
  user?: PublicUser;
  sessionId?: ObjectId;
}
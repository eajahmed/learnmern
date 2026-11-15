import { Router } from "express";

import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from "./user.controllers.js";

import { authenticateToken } from "./user.service.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, getMe);

export const authRoutes = router;
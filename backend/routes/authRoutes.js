import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.put("/change-password", protect, changePassword);

router.post("/logout", protect, logout);

export default router;

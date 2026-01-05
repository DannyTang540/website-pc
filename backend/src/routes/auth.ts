import express from "express";
import {
  register,
  login,
  getCurrentUser,
  logout,
  refreshToken,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authenticateToken, getCurrentUser);
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.post("/logout", authenticateToken, logout);

export default router;

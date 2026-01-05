import express from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  blockUser,
  unblockUser,
  deleteUser,
  getUsersCount,
} from "../controllers/usersController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getUsers);
router.get("/count", authenticateToken, requireAdmin, getUsersCount);
router.get("/:id", authenticateToken, requireAdmin, getUserById);
router.put("/:id/role", authenticateToken, requireAdmin, updateUserRole);
router.put("/:id/block", authenticateToken, requireAdmin, blockUser);
router.put("/:id/unblock", authenticateToken, requireAdmin, unblockUser);
router.delete("/:id", authenticateToken, requireAdmin, deleteUser);

export default router;

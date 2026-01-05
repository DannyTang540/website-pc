// routes/categories.ts
import express from "express";
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/all", getAllCategories); // For admin panel
router.get("/:id", getCategoryById);
router.get("/slug/:slug", getCategoryBySlug);

// Protected routes (admin only)
router.post("/", authenticateToken, requireAdmin, createCategory);
router.put("/:id", authenticateToken, requireAdmin, updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, deleteCategory);

export default router;

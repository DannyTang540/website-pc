import express from "express";
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotionsController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

router.get("/", getPromotions);
router.get("/:id", getPromotionById);
router.post("/", authenticateToken, requireAdmin, createPromotion);
router.put("/:id", authenticateToken, requireAdmin, updatePromotion);
router.delete("/:id", authenticateToken, requireAdmin, deletePromotion);

export default router;

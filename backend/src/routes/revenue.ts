import express from "express";
import {
  getRevenueStats,
  getOverview,
  getTopProducts,
} from "../controllers/revenueController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

// Admin routes only
router.get("/stats", authenticateToken, requireAdmin, getRevenueStats);
router.get("/overview", authenticateToken, requireAdmin, getOverview);
router.get("/top-products", authenticateToken, requireAdmin, getTopProducts);

export default router;

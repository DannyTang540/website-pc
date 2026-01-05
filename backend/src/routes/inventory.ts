import express from "express";
import {
  getInventory,
  getLowStock,
  updateInventoryStock,
} from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

// Admin routes
router.get("/", authenticateToken, requireAdmin, getInventory);
router.get("/low-stock", authenticateToken, requireAdmin, getLowStock);
router.put("/:productId", authenticateToken, requireAdmin, updateInventoryStock);

export default router;

import express from "express";
import { cleanupSampleData } from "../controllers/adminController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

// WARNING: This endpoint permanently deletes demo/sample data. Protected by admin middleware.
router.post(
  "/cleanup-sample-data",
  authenticateToken,
  requireAdmin,
  cleanupSampleData
);

export default router;

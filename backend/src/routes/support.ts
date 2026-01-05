import express from "express";
import { getMessages, replyMessage } from "../controllers/supportController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = express.Router();

// Admin routes
router.get("/", authenticateToken, requireAdmin, getMessages);
router.post("/:id/reply", authenticateToken, requireAdmin, replyMessage);

export default router;

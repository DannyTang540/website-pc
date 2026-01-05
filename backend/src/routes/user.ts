import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/userController";

const router = express.Router();

router.get("/addresses", authenticateToken, getAddresses);
router.post("/addresses", authenticateToken, addAddress);
router.put("/addresses/:id", authenticateToken, updateAddress);
router.delete("/addresses/:id", authenticateToken, deleteAddress);

export default router;

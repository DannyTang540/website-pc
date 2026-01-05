// backend/src/routes/cart.ts
import express from "express";
import * as cartController from "../controllers/cartController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's cart
router.get("/", cartController.getCart);

// Add item to cart
router.post("/items", cartController.addToCart);

// Update cart item quantity
router.put("/items/:itemId", cartController.updateCartItem);

// Remove item from cart
router.delete("/items/:itemId", cartController.removeFromCart);

// Clear cart
router.delete("/", cartController.clearCart);

export default router;

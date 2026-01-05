import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  clearFavorites,
} from "../controllers/favoritesController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's favorites
router.get("/", getFavorites);

// Add product to favorites
router.post("/", addToFavorites);

// Check if product is in favorites
router.get("/check/:productId", checkFavorite);

// Remove product from favorites
router.delete("/:productId", removeFromFavorites);

// Clear all favorites
router.delete("/", clearFavorites);

export default router;

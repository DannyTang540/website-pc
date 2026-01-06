import { Request, Response } from "express";
import pool from "../database/database";
import { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2";

interface FavoriteRow extends RowDataPacket {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: string;
  images: string;
  description: string;
  addedAt: Date;
}

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [favorites] = await pool.query<FavoriteRow[]>(
      `SELECT f.id, p.id as product_id, p.name, p.slug, p.price, p.images, p.description, f.created_at as addedAt 
       FROM favorites f 
       JOIN products p ON f.product_id = p.id 
       WHERE f.user_id = ? 
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const formattedFavorites = Array.isArray(favorites)
      ? favorites.map((fav) => ({
          id: fav.id,
          product: {
            id: fav.product_id,
            name: fav.name,
            slug: fav.slug,
            price: parseFloat(fav.price),
            images: fav.images ? JSON.parse(fav.images) : [],
            description: fav.description,
          },
          addedAt: fav.addedAt.toISOString(),
        }))
      : [];

    return res.json(formattedFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
};

export const addToFavorites = async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const [products] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already in favorites
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(200).json({ message: "Product already in favorites" });
    }

    // Add to favorites
    await pool.query<ResultSetHeader>(
      "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
      [userId, productId]
    );

    // Get the added favorite with product details
    const [addedFavorite] = await pool.query<FavoriteRow[]>(
      `SELECT f.id, p.id as product_id, p.name, p.slug, p.price, p.images, p.description, f.created_at as addedAt 
       FROM favorites f 
       JOIN products p ON f.product_id = p.id 
       WHERE f.user_id = ? AND f.product_id = ?
       ORDER BY f.created_at DESC
       LIMIT 1`,
      [userId, productId]
    );

    const favorite =
      Array.isArray(addedFavorite) && addedFavorite.length > 0
        ? addedFavorite[0]
        : null;

    if (!favorite) {
      return res.status(201).json({ message: "Added to favorites" });
    }

    res.status(201).json({
      id: favorite.id,
      product: {
        id: favorite.product_id,
        name: favorite.name,
        slug: favorite.slug,
        price: parseFloat(favorite.price),
        images: favorite.images ? JSON.parse(favorite.images) : [],
        description: favorite.description,
      },
      addedAt: favorite.addedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: "Error adding to favorites" });
  }
};

export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Remove from favorites
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: "Error removing from favorites" });
  }
};

export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product is in favorites
    const [favorites] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    const isFavorite = Array.isArray(favorites) && favorites.length > 0;
    res.json({ isFavorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Error checking favorite status" });
  }
};

export const clearFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Clear all favorites for user
    await pool.query<ResultSetHeader>(
      "DELETE FROM favorites WHERE user_id = ?",
      [userId]
    );

    res.status(200).json({ message: "Favorites cleared successfully" });
  } catch (error) {
    console.error("Error clearing favorites:", error);
    res.status(500).json({ message: "Error clearing favorites" });
  }
};

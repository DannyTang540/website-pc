// backend/src/models/Cart.ts
import { PoolConnection } from "mysql2/promise";
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
}

export class CartModel {
  // Find or create user's cart
  static async findByUserId(userId: string): Promise<Cart | null> {
    const connection = await pool.getConnection();
    try {
      // Try to find existing cart
      const [carts]: any[] = await connection.execute(
        `SELECT * FROM carts WHERE user_id = ?`,
        [userId]
      );

      const cart = carts[0] as Cart | undefined;

      // If no cart exists, create one
      if (!cart) {
        return await this.create(userId);
      }

      // Get cart items
      const [items]: any[] = await connection.execute(
        `SELECT * FROM cart_items WHERE cart_id = ?`,
        [cart.id]
      );

      return {
        ...cart,
        items: items || [],
      };
    } catch (error) {
      console.error("Error finding cart:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Create new cart
  static async create(userId: string): Promise<Cart> {
    const id = uuidv4();
    const now = new Date();
    const connection = await pool.getConnection();

    try {
      await connection.execute(
        `INSERT INTO carts (id, user_id, total, created_at, updated_at)
         VALUES (?, ?, 0, ?, ?)`,
        [id, userId, now, now]
      );

      return {
        id,
        userId,
        total: 0,
        items: [],
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Error creating cart:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Add item to cart or update quantity if exists
  static async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    price: number,
    name: string,
    image: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if item already exists in cart
      const [existingItems]: any[] = await connection.execute(
        `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`,
        [cartId, productId]
      );

      const now = new Date();

      if (existingItems && existingItems.length > 0) {
        // Update existing item quantity
        await connection.execute(
          `UPDATE cart_items 
           SET quantity = quantity + ?, updated_at = ? 
           WHERE id = ?`,
          [quantity, now, existingItems[0].id]
        );
      } else {
        // Add new item
        const itemId = uuidv4();
        await connection.execute(
          `INSERT INTO cart_items 
           (id, cart_id, product_id, quantity, price, name, image, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, cartId, productId, quantity, price, name, image, now, now]
        );
      }

      // Update cart total
      await this.updateCartTotal(cartId, connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Error adding item to cart:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update cart item quantity
  static async updateItem(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get cart ID for the user
      const [carts]: any[] = await connection.execute(
        `SELECT id FROM carts WHERE user_id = ?`,
        [userId]
      );

      if (carts.length === 0) {
        throw new Error("Cart not found");
      }

      const cartId = carts[0].id;

      if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        await this.removeItem(cartId, itemId, connection);
        return;
      }

      // Update item quantity
      await connection.execute(
        `UPDATE cart_items 
         SET quantity = ?, updated_at = ? 
         WHERE id = ? AND cart_id = ?`,
        [quantity, new Date(), itemId, cartId]
      );

      // Update cart total
      await this.updateCartTotal(cartId, connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Error updating cart item quantity:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Remove item from cart
  static async removeItem(
    cartId: string,
    itemId: string,
    connection?: PoolConnection
  ): Promise<void> {
    const shouldRelease = !connection;
    if (!connection) {
      connection = await pool.getConnection();
    }

    try {
      if (!shouldRelease) {
        await connection.beginTransaction();
      }

      // Remove item from cart
      await connection.execute(
        `DELETE FROM cart_items WHERE id = ? AND cart_id = ?`,
        [itemId, cartId]
      );

      // Update cart total
      await this.updateCartTotal(cartId, connection);

      if (!shouldRelease) {
        await connection.commit();
      }
    } catch (error) {
      if (!shouldRelease) {
        await connection.rollback();
      }
      console.error("Error removing item from cart:", error);
      throw error;
    } finally {
      if (shouldRelease && connection) {
        connection.release();
      }
    }
  }

  // Clear cart
  static async clearCart(userId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get cart ID for user
      const [carts]: any[] = await connection.execute(
        `SELECT id FROM carts WHERE user_id = ?`,
        [userId]
      );

      if (!carts || carts.length === 0) {
        return; // No cart to clear
      }

      const cartId = carts[0].id;

      // Remove all items from cart
      await connection.execute(`DELETE FROM cart_items WHERE cart_id = ?`, [
        cartId,
      ]);

      // Reset cart total
      await connection.execute(
        `UPDATE carts SET total = 0, updated_at = ? WHERE id = ?`,
        [new Date(), cartId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Error clearing cart:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper method to update cart total
  private static async updateCartTotal(
    cartId: string,
    connection: PoolConnection
  ): Promise<void> {
    try {
      // Calculate new total from all items
      const [result]: any[] = await connection.execute(
        `SELECT SUM(price * quantity) as total FROM cart_items WHERE cart_id = ?`,
        [cartId]
      );

      const total = result[0].total || 0;

      // Update cart with new total
      await connection.execute(
        `UPDATE carts SET total = ?, updated_at = ? WHERE id = ?`,
        [total, new Date(), cartId]
      );
    } catch (error) {
      console.error("Error updating cart total:", error);
      throw error;
    }
  }
}

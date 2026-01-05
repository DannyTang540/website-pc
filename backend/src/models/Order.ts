// backend/src/models/Order.ts
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  shippingAddress: string;
  city: string;
  district: string;
  ward: string;
  phone: string;
  email: string;
  fullName: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  note?: string;
  orderNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export class OrderModel {
  // Create new order
  static async create(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'isPaid' | 'isDelivered' | 'status'>,
    items: Array<Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Order> {
    const id = uuidv4();
    const now = new Date();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create order
      await connection.execute(
        `INSERT INTO orders (id, user_id, total, status, shipping_address, city, phone, payment_method, is_paid, is_delivered, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, FALSE, FALSE, ?, ?)`,
        [id, orderData.userId, orderData.total, orderData.shippingAddress, 
         orderData.city, orderData.phone, orderData.paymentMethod, now, now]
      );

      // Add order items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (id, order_id, product_id, quantity, price, name, image, created_at, updated_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, item.productId, item.quantity, item.price, 
           item.name, item.image, now, now]
        );

        // Update product stock
        await connection.execute(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity, item.productId]
        );
      }

      // Clear user's cart
      await connection.execute(
        `DELETE ci FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.id
         WHERE c.user_id = ?`,
        [orderData.userId]
      );

      await connection.commit();

      // Return the created order
      return await this.findById(id) as Order;
    } catch (error) {
      await connection.rollback();
      console.error('Error creating order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find order by ID
  static async findById(id: string): Promise<Order | null> {
    try {
      const [orders]: any[] = await pool.execute(
        `SELECT * FROM orders WHERE id = ?`,
        [id]
      );
      
      if (!orders.length) return null;

      const [items]: any[] = await pool.execute(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [id]
      );

      return {
        ...orders[0],
        items: items.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          orderId: item.order_id,
          productId: item.product_id
        }))
      };
    } catch (error) {
      console.error('Error finding order:', error);
      throw error;
    }
  }

  // Find all orders by user ID
  static async findByUserId(userId: string): Promise<Order[]> {
    try {
      const [orders]: any[] = await pool.execute(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );

      const ordersWithItems = await Promise.all(
        orders.map(async (order: any) => {
          const [items]: any[] = await pool.execute(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [order.id]
          );
          
          return {
            ...order,
            items: items.map((item: any) => ({
              ...item,
              id: item.id.toString(),
              orderId: item.order_id,
              productId: item.product_id
            }))
          };
        })
      );

      return ordersWithItems;
    } catch (error) {
      console.error('Error finding user orders:', error);
      throw error;
    }
  }

  // Update order status
  static async updateStatus(id: string, status: Order['status']): Promise<boolean> {
    try {
      const [result]: any = await pool.execute(
        `UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`,
        [status, new Date(), id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Mark order as paid
  static async markAsPaid(id: string): Promise<boolean> {
    try {
      const [result]: any = await pool.execute(
        `UPDATE orders SET is_paid = TRUE, paid_at = ?, updated_at = ? WHERE id = ?`,
        [new Date(), new Date(), id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  // Mark order as delivered
  static async markAsDelivered(id: string): Promise<boolean> {
    try {
      const [result]: any = await pool.execute(
        `UPDATE orders SET is_delivered = TRUE, delivered_at = ?, updated_at = ? WHERE id = ?`,
        [new Date(), new Date(), id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      throw error;
    }
  }
}
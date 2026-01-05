import { Request, Response } from "express";
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

// Create order (simple MySQL implementation)
export const createOrder = async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const userId = (req as any).userId || req.body.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { items, shippingAddress, city, phone, paymentMethod, total } =
      req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Items are required" });
    }

    // Check stock for each item and reserve
    for (const it of items) {
      const [rows] = await conn.query(
        "SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE",
        [it.productId]
      );
      const r = (rows as any[])[0];
      const stock = r ? Number(r.stock_quantity || 0) : 0;
      if (stock < Number(it.quantity)) {
        await conn.rollback();
        return res
          .status(400)
          .json({
            success: false,
            message: `Insufficient stock for product ${it.productId}`,
          });
      }
    }

    // Create order
    const orderId = uuidv4();
    await conn.execute(
      `INSERT INTO orders (id, user_id, total, status, shipping_address, city, phone, payment_method, is_paid, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        orderId,
        userId,
        total || 0,
        shippingAddress || "",
        city || "",
        phone || "",
        paymentMethod || "cod",
      ]
    );

    // Insert order items and decrement stock
    for (const it of items) {
      const itemId = uuidv4();
      await conn.execute(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price, name, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          itemId,
          orderId,
          it.productId,
          it.quantity,
          it.price,
          it.name,
          it.image || null,
        ]
      );

      // Decrement stock
      await conn.execute(
        `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?), in_stock = CASE WHEN stock_quantity - ? > 0 THEN 1 ELSE 0 END, updated_at = NOW() WHERE id = ?`,
        [it.quantity, it.quantity, it.productId]
      );
    }

    await conn.commit();

    res.status(201).json({ success: true, message: "Order created", orderId });
  } catch (error: any) {
    await conn.rollback();
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating order",
        error: error.message,
      });
  } finally {
    conn.release();
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const [rows] = await pool.execute(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const [orders] = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [
      id,
    ]);
    const order = (orders as any[])[0];
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    // Allow admin or owner (if userId present)
    if (
      userId &&
      order.user_id !== userId &&
      (req as any).userRole !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const [items] = await pool.execute(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [id]
    );
    order.items = items;
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error getting order by id:", error);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
};

export default { createOrder, getUserOrders, getOrderById };
// // backend/src/controllers/orderController.ts
// import { Request, Response } from "express";
// import mongoose from "mongoose";
// import { ProductModel } from "../models/Product";
// import { OrderModel } from "../models/Order";

// // Define user payload interface
// interface UserPayload {
//   id: string;
//   email: string;
//   role: string;
//   isAdmin?: boolean;
// }

// // Extend Express Request type
// declare global {
//   namespace Express {
//     interface Request {
//       user?: UserPayload;
//     }
//   }
// }

// interface AuthRequest extends Request {
//   user?: UserPayload;
// }

// // Create new order
// export const createOrder = async (req: AuthRequest, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const { items, shippingAddress, paymentMethod, note } = req.body;

//     // Validate items
//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: "Items are required" });
//     }

//     // Calculate total and check stock
//     let total = 0;
//     const orderItems = [];

//     for (const item of items) {
//       const product = await ProductModel.findById(item.productId).session(session);
//       if (!product) {
//         await session.abortTransaction();
//         return res.status(404).json({ error: `Product ${item.productId} not found` });
//       }

//       if (product.stockQuantity < item.quantity) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
//         });
//       }

//       const itemTotal = product.price * item.quantity;
//       total += itemTotal;

//       orderItems.push({
//         productId: product._id,
//         name: product.name,
//         price: product.price,
//         quantity: item.quantity,
//         image: product.images?.[0],
//       });

//       // Update product stock
//       product.stockQuantity -= item.quantity;
//       await product.save({ session });
//     }

//     // Create order
//     const order = new OrderModel({
//       userId,
//       items: orderItems,
//       total,
//       shippingAddress,
//       paymentMethod: paymentMethod || "cod",
//       paymentStatus: "pending",
//       status: "pending",
//       note,
//     });

//     await order.save({ session });
//     await session.commitTransaction();

//     res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       data: order,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   } finally {
//     session.endSession();
//   }
// };

// // Get order by ID
// export const getOrderById = async (req: AuthRequest, res: Response) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user?.id;
//     const isAdmin = req.user?.isAdmin || req.user?.role === "admin";

//     const order = await OrderModel.findById(id)
//       .populate("userId", "name email")
//       .populate("items.productId", "name price images");

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Check permission
//     if (order.userId.toString() !== userId && !isAdmin) {
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     res.json({
//       success: true,
//       data: order,
//     });
//   } catch (error) {
//     console.error("Error fetching order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Get all orders (admin)
// export const getAllOrders = async (req: AuthRequest, res: Response) => {
//   try {
//     const isAdmin = req.user?.isAdmin || req.user?.role === "admin";
//     if (!isAdmin) {
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;

//     const query: any = {};

//     if (status) query.status = status;

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate as string);
//       if (endDate) query.createdAt.$lte = new Date(endDate as string);
//     }

//     if (search) {
//       query.$or = [
//         { "shippingAddress.fullName": { $regex: search, $options: "i" } },
//         { "shippingAddress.phone": { $regex: search, $options: "i" } },
//         { "shippingAddress.email": { $regex: search, $options: "i" } },
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [orders, total] = await Promise.all([
//       OrderModel.find(query)
//         .populate("userId", "name email")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),
//       OrderModel.countDocuments(query),
//     ]);

//     res.json({
//       success: true,
//       data: orders,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         pages: Math.ceil(total / Number(limit)),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Get user orders
// export const getUserOrders = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const { status } = req.query;
//     const query: any = { userId };

//     if (status) {
//       query.status = status;
//     }

//     const orders = await OrderModel.find(query)
//       .sort({ createdAt: -1 })
//       .populate("items.productId", "name price images");

//     res.json({
//       success: true,
//       data: orders,
//     });
//   } catch (error) {
//     console.error("Error fetching user orders:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Update order status (admin)
// export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const isAdmin = req.user?.isAdmin || req.user?.role === "admin";
//     if (!isAdmin) {
//       await session.abortTransaction();
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     const { id } = req.params;
//     const { status } = req.body;

//     const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
//     if (!validStatuses.includes(status)) {
//       await session.abortTransaction();
//       return res.status(400).json({ error: "Invalid status" });
//     }

//     const order = await OrderModel.findById(id).session(session);
//     if (!order) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // If cancelling order, restore product stock
//     if (status === "cancelled" && order.status !== "cancelled") {
//       for (const item of order.items) {
//         const product = await ProductModel.findById(item.productId).session(session);
//         if (product) {
//           product.stockQuantity += item.quantity;
//           await product.save({ session });
//         }
//       }
//     }

//     order.status = status;
//     order.updatedAt = new Date();
//     await order.save({ session });
//     await session.commitTransaction();

//     res.json({
//       success: true,
//       message: "Order status updated successfully",
//       data: order,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error updating order status:", error);
//     res.status(500).json({ error: "Internal server error" });
//   } finally {
//     session.endSession();
//   }
// };

// // Cancel order (user)
// export const cancelOrder = async (req: AuthRequest, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       await session.abortTransaction();
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const { id } = req.params;
//     const { reason } = req.body;

//     const order = await OrderModel.findById(id).session(session);
//     if (!order) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Check permission
//     if (order.userId.toString() !== userId) {
//       await session.abortTransaction();
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     // Only allow cancellation if order is pending
//     if (order.status !== "pending") {
//       await session.abortTransaction();
//       return res.status(400).json({
//         error: "Order can only be cancelled while in pending status",
//       });
//     }

//     // Restore product stock
//     for (const item of order.items) {
//       const product = await ProductModel.findById(item.productId).session(session);
//       if (product) {
//         product.stockQuantity += item.quantity;
//         await product.save({ session });
//       }
//     }

//     order.status = "cancelled";
//     order.cancellationReason = reason;
//     order.updatedAt = new Date();
//     await order.save({ session });
//     await session.commitTransaction();

//     res.json({
//       success: true,
//       message: "Order cancelled successfully",
//       data: order,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error cancelling order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   } finally {
//     session.endSession();
//   }
// };

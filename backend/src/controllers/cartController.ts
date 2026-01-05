// backend/src/controllers/cartController.ts
import { Request, Response } from "express";
import { CartModel, Cart, CartItem } from "../models/Cart";
import pool from "../database/database";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: {
    id: string;
    isAdmin: boolean;
  };
}

interface CartItemRequest {
  productId: string;
  quantity: number;
}
// Hàm helper để lấy userId từ request
const getUserIdFromRequest = (req: AuthRequest): string | null => {
  // Ưu tiên lấy từ req.userId (nếu middleware đặt)
  if (req.userId) {
    console.log("User ID from request:", req.userId);
    return req.userId;
  }

  // Sau đó lấy từ req.user?.id
  if (req.user?.id) {
    console.log("User ID from user:", req.user.id);
    return req.user.id;
  }

  // Nếu vẫn không có, kiểm tra token từ header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const jwt = require("jsonwebtoken");
      const decoded = jwt.decode(token);
      console.log("Decoded token directly:", decoded);

      if (decoded && decoded.id) {
        console.log("Got userId from decoded token:", decoded.id);
        return decoded.id;
      }
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }

  console.log("No userId found in request");
  return null;
};

export const getCart = async (req: AuthRequest, res: Response) => {
  console.log("User ID:", req.user?.id);
  console.log("Auth Request - user:", req.user);
  console.log("Auth Request - headers:", req.headers.authorization);
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      console.log("User ID not found in request");
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const cart = await CartModel.findByUserId(userId);
    if (!cart) {
      return res.json({
        id: null,
        userId: userId,
        items: [],
        total: 0,
      });
    }

    res.json(cart);
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({
      message: "Lỗi khi lấy giỏ hàng",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  console.log("Add to cart - Headers:", req.headers);
  console.log("Add to cart - Body:", req.body);

  try {
    const userId = getUserIdFromRequest(req);
    // Support both product_id and productId for backward compatibility
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity || 1;

    if (!productId) {
      return res.status(400).json({
        message: "Thiếu thông tin sản phẩm",
        details: "Vui lòng cung cấp productId hoặc product_id",
      });
    }

    const finalProductId = productId;
    console.log("User ID from request:", userId);
    console.log("Product ID:", productId, "Quantity:", quantity);

    if (!userId) {
      console.error("No user ID found");
      return res.status(401).json({
        message: "Chưa đăng nhập",
        details: "Không thể xác định người dùng",
      });
    }

    if (!productId) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    // Get product to verify it exists and get details
    console.log("Querying product:", productId);
    const [products]: any[] = await pool.execute(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    console.log("Product query result:", products);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const product = products[0];

    // Xử lý images nếu là JSON string
    let productImages: string[] = [];
    if (product.images) {
      try {
        if (typeof product.images === "string") {
          productImages = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          productImages = product.images;
        }
      } catch (e) {
        console.warn("Error parsing product images:", e);
      }
    }

    // Check if product is in stock
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        message: `Sản phẩm ${product.name} không đủ hàng`,
        available: product.stock_quantity,
      });
    }

    // Find or create cart
    let cart = await CartModel.findByUserId(userId);
    console.log("Found existing cart:", cart);

    if (!cart) {
      console.log("Creating new cart for user:", userId);
      cart = await CartModel.create(userId);
      console.log("Created cart:", cart);
    }

    // Add item to cart
    console.log("Adding item to cart:", {
      cartId: cart.id,
      productId: productId,
      quantity,
      price: product.price,
      name: product.name,
      image: productImages.length > 0 ? productImages[0] : "",
    });

    await CartModel.addItem(
      cart.id,
      productId,
      quantity,
      product.price || 0,
      product.name || "Sản phẩm",
      productImages.length > 0 ? productImages[0] : ""
    );
    // Return updated cart
    const updatedCart = await CartModel.findByUserId(userId);
    console.log("Updated cart:", updatedCart);

    res.json({
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng",
      cart: updatedCart,
    });
  } catch (error: any) {
    console.error("Lỗi khi thêm vào giỏ hàng:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });

    res.status(500).json({
      message: "Lỗi khi thêm vào giỏ hàng",
      error: error.message,
      sqlError: error.sqlMessage || "No SQL error",
      code: error.code || "UNKNOWN_ERROR",
    });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || req.user?.id;
    const { itemId } = req.params;
    const { quantity } = req.body as { quantity: number };

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      const cart = await CartModel.findByUserId(userId);
      if (cart) {
        await CartModel.removeItem(cart.id, itemId);
      }
      const updatedCart = await CartModel.findByUserId(userId);
      return res.json(updatedCart);
    }

    // Update item quantity
    await CartModel.updateItem(userId, itemId, quantity);

    // Return updated cart
    const updatedCart = await CartModel.findByUserId(userId);
    res.json(updatedCart);
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật giỏ hàng" });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || req.user?.id;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Find cart to get cart ID
    const cart = await CartModel.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }

    // Remove item from cart
    await CartModel.removeItem(cart.id, itemId);

    // Return updated cart
    const updatedCart = await CartModel.findByUserId(userId);
    res.json(updatedCart);
  } catch (error) {
    console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi khi xóa khỏi giỏ hàng" });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    await CartModel.clearCart(userId);

    // Return empty cart
    const cart = await CartModel.findByUserId(userId);
    res.json({
      message: "Đã xóa tất cả sản phẩm khỏi giỏ hàng",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi xóa giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi khi xóa giỏ hàng" });
  }
};

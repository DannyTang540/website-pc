import express from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import * as orderController from "../controllers/orderController";

const router = express.Router();

// Create order (authenticated)
router.post("/", authenticateToken, orderController.createOrder);

// Get current user's orders
router.get("/my-orders", authenticateToken, orderController.getUserOrders);

// Order history (used by frontend)
router.get("/history", authenticateToken, orderController.getOrderHistory);

// Admin: list all orders
router.get("/", authenticateToken, requireAdmin, orderController.getAllOrders);

// Admin: update order status
router.put(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  orderController.updateOrderStatus
);

// Get order by id (authenticated)
router.get("/:id", authenticateToken, orderController.getOrderById);

export default router;
// // backend/src/routes/order.ts
// import express from "express";
// // import * as orderController from "../controllers/orderController";A
// import { authenticateToken, isAdmin } from "../middleware/auth";

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(authenticateToken);

// // Create new order
// router.post("/", orderController.createOrder);

// // Get user's orders
// router.get("/my-orders", orderController.getUserOrders);

// // Get order by ID
// router.get("/:id", orderController.getOrder);

// // Admin routes
// router.put("/:id/status", isAdmin, orderController.updateOrderStatus);
// router.put("/:id/pay", isAdmin, orderController.markOrderAsPaid);
// router.put("/:id/deliver", isAdmin, orderController.markOrderAsDelivered);

// export default router;

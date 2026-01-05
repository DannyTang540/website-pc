// app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import categoryRoutes from "./routes/categories";
import productRoutes from "./routes/products";
import bannerRoutes from "./routes/banner";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import promotionRoutes from "./routes/promotions";
import supportRoutes from "./routes/support";
import revenueRoutes from "./routes/revenue";
import componentsRoutes from "./routes/components";
import adminRoutes from "./routes/admin";
import userRoutesSingle from "./routes/user";
import favoritesRoutes from "./routes/favorites";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers - configure helmet to allow cross-origin resources
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
// Static files
const uploadsDir = path.join(process.cwd(), "public", "uploads");
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res) => {
      // Allow all origins for static files
      res.set("Access-Control-Allow-Origin", "*");
      // Disable Cross-Origin-Resource-Policy to allow cross-origin access
      res.removeHeader("Cross-Origin-Resource-Policy");
      res.set(
        "Access-Control-Allow-Methods",
        corsOptions.methods?.join(",") || ""
      );
      res.set(
        "Access-Control-Allow-Headers",
        corsOptions.allowedHeaders?.join(",") || ""
      );
      res.set("Cache-Control", "public, max-age=31536000");
    },
  })
);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/components", componentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutesSingle);
app.use("/api/favorites", favoritesRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy tài nguyên",
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Lỗi:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Kích thước file quá lớn. Tối đa 5MB.",
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message:
        "Định dạng file không hợp lệ. Chỉ chấp nhận jpg, jpeg, png, gif, webp.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Lỗi máy chủ nội bộ",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🟢 Server đang chạy trên cổng ${PORT}`);
  console.log(`🌍 Môi trường: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS cho phép: ${corsOptions.origin}`);
  console.log(`📁 Thư mục upload: ${uploadsDir}`);
});


export default app;

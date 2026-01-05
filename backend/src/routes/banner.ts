// routes/banner.ts
import { Router } from "express";
import {
  getBanners,
  getBannerById,
  getBannersAdmin, // Lấy tất cả banner (bao gồm cả không hoạt động)
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../controllers/bannerController";
import { authenticateToken, isAdmin } from "../middleware/auth";
import { handleSingleUpload } from "../middleware/upload";

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.get("/", getBanners); // Lấy danh sách banner đang hoạt động
router.get("/active", getBanners); // Tương tự như trên
router.get("/:id", getBannerById); // Xem chi tiết 1 banner

// ==================== ADMIN ROUTES ====================
const adminRouter = Router();
router.use("/admin", adminRouter); // Tất cả route dưới đây đều bắt đầu bằng /admin

// Apply authentication and admin check to all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(isAdmin);

// Quản lý banner (chỉ admin)
adminRouter.get("/banners", getBannersAdmin);
adminRouter.post("/banners", handleSingleUpload("image"), createBanner);
adminRouter.put("/banners/:id", handleSingleUpload("image"), updateBanner);
adminRouter.patch("/banners/:id/status", toggleBannerStatus);
adminRouter.delete("/banners/:id", deleteBanner);

export default router;

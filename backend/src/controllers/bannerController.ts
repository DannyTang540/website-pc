// controllers/banners.ts
import { Response, Request } from "express";
import { BannerModel } from "../models/Banner";


// Extend Express Request type to include our custom properties
interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const getBanners = async (req: Request, res: Response) => {
  try {
    const banners = await BannerModel.findAll();

    res.json({
      success: true,
      data: banners,
    });
  } catch (error: unknown) {
    console.error("Get banner error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBannersAdmin = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    console.log("User accessing admin banners:", {
      userId: authReq.userId,
      userRole: authReq.userRole,
      timestamp: new Date().toISOString(),
    });

    const banners = await BannerModel.findAllAdmin();

    if (!banners) {
      console.warn("No banners found in database");
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: banners,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Get admin banners error:", {
      error: errorMessage,
      stack: errorStack,
      userId: authReq.userId,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof Error && error.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

export const getBannerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await BannerModel.findById(id);

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, data: banner });
  } catch (error: unknown) {
    console.error("Get banner error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// In bannerController.ts
export const createBanner = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên hình ảnh",
      });
    }

    // Get the full URL of the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imagePath = `/uploads/banners/${req.file.filename}`;
    const imageUrl = `${baseUrl}${imagePath}`;

    const bannerData = {
      ...req.body,
      image: imagePath, // Store relative path in database
      imageUrl: imageUrl, // Store full URL for frontend
      isActive: req.body.isActive === "true" || req.body.isActive === true,
      order: req.body.order ? Number(req.body.order) : 0,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
    };

    const bannerId = await BannerModel.create(bannerData);
    const banner = await BannerModel.findById(bannerId);

    // Return both the path and full URL
    res.status(201).json({
      success: true,
      data: {
        ...banner,
        image: imagePath,
        imageUrl: imageUrl,
      },
      message: "Tạo banner thành công",
    });
  } catch (error: unknown) {
    console.error("Lỗi khi tạo banner:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};

// In bannerController.ts
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bannerData: any = {
      ...req.body,
      isActive: req.body.isActive === "true" || req.body.isActive === true,
    };

    if (req.file) {
      // Get the full URL of the uploaded file
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const imagePath = `/uploads/banners/${req.file.filename}`;
      const imageUrl = `${baseUrl}${imagePath}`;

      bannerData.image = imagePath; // Store relative path in database
      bannerData.imageUrl = imageUrl; // Store full URL for frontend
    }

    if (req.body.order !== undefined) bannerData.order = Number(req.body.order);
    if (req.body.startDate) bannerData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) bannerData.endDate = new Date(req.body.endDate);

    const updated = await BannerModel.update(id, bannerData);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy banner",
      });
    }

    // Get the updated banner
    const banner = await BannerModel.findById(id);

    // Create a response object with the image URL
    const responseData = {
      ...banner,
      // If no new image was uploaded but we have an existing one, include the full URL
      ...(!req.file &&
        banner?.image && {
          imageUrl: `${req.protocol}://${req.get("host")}${banner.image}`,
        }),
    };

    res.json({
      success: true,
      data: responseData,
      message: "Cập nhật banner thành công",
    });
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật banner:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await BannerModel.delete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Delete banner error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
};

export const toggleBannerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await BannerModel.update(id, { isActive });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    const banner = await BannerModel.findById(id);
    res.json({
      success: true,
      data: banner,
      message: "Banner status updated successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Toggle banner status error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
};

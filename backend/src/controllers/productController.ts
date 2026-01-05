// In backend/src/controllers/productController.ts
import { Request, Response } from "express";
import { ProductModel, Product } from "../models/Product";
import ComponentModel from "../models/Component";
import slugify from "slugify";
import fs from "fs";
import path from "path";

// Helper to remove uploaded files on error
// Helper to remove uploaded files on error
const cleanupFiles = (files: any) => {
  if (!files) return;

  // Xử lý cho multer (files là mảng)
  if (Array.isArray(files)) {
    files.forEach((file: Express.Multer.File) => {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`✅ Cleaned up file: ${file.path}`);
        }
      } catch (e) {
        console.error("Error cleaning up file:", e);
      }
    });
  }
  // Xử lý cho multiparty (dự phòng)
  else if (typeof files === "object") {
    Object.values(files).forEach((fileArray: any) => {
      if (Array.isArray(fileArray)) {
        fileArray.forEach((file: any) => {
          try {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (e) {
            console.error("Error cleaning up file:", e);
          }
        });
      }
    });
  }
};
// Create new product (Admin) - Sử dụng MULTER
export const createProduct = async (req: Request, res: Response) => {
  console.log("🆕 [Controller] Create product request received");

  try {
    // Lấy dữ liệu từ multer
    const files = req.files as Express.Multer.File[];
    const body = req.body;

    console.log("📦 Request body keys:", Object.keys(body));
    console.log("📁 Uploaded files count:", files?.length || 0);

    // Lấy các field từ body
    const {
      name,
      description = "",
      price,
      originalPrice,
      categoryId,
      brand = "",
      stockQuantity = 0,
      featured = false,
      slug,
      tags = "[]",
      specifications = "{}",
      isComponent = "false",
      createAsComponent = "false",
      status = "inactive",
      shortDescription = "",
      existingImages = "[]",
    } = body;

    // Validate required fields
    if (!name || !price || !categoryId) {
      // Cleanup uploaded files if validation fails
      if (files && files.length > 0) {
        files.forEach((file: Express.Multer.File) => {
          try {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (e) {
            console.error("Error cleaning up file:", e);
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc: tên, giá, hoặc danh mục",
        missing: {
          name: !name,
          price: !price,
          categoryId: !categoryId,
        },
      });
    }

    // Parse các trường JSON
    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (e: any) {
      console.warn("Cannot parse tags, using empty array:", e.message);
      parsedTags = [];
    }

    let parsedSpecifications = {};
    try {
      parsedSpecifications = specifications ? JSON.parse(specifications) : {};
    } catch (e: any) {
      console.warn(
        "Cannot parse specifications, using empty object:",
        e.message
      );
      parsedSpecifications = {};
    }

    let parsedExistingImages = [];
    try {
      parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
    } catch (e: any) {
      console.warn(
        "Cannot parse existingImages, using empty array:",
        e.message
      );
      parsedExistingImages = [];
    }

    // Xử lý ảnh
    const images: string[] = [...parsedExistingImages];

    // Thêm ảnh upload từ multer
    if (files && files.length > 0) {
      for (const file of files) {
        // Multer đã lưu file, chỉ cần lấy đường dẫn tương đối
        const relativePath = `/uploads/products/${path.basename(file.path)}`;
        images.push(relativePath);
      }
    }

    // Parse numbers
    const priceNum = parseFloat(price);
    const originalPriceNum = originalPrice
      ? parseFloat(originalPrice)
      : priceNum;
    const stockQuantityNum = parseInt(stockQuantity) || 0;

    // Create product data
    const productData = {
      name: String(name),
      description: String(description),
      shortDescription: String(shortDescription),
      price: priceNum,
      originalPrice: originalPriceNum,
      categoryId: String(categoryId),
      brand: String(brand),
      images,
      specifications: parsedSpecifications,
      stockQuantity: stockQuantityNum,
      inStock: stockQuantityNum > 0,
      featured: featured === "true" || featured === true,
      slug: slug || slugify(String(name), { lower: true, strict: true }),
      tags: parsedTags,
      status: (status === "active" ? "active" : "inactive") as
        | "active"
        | "inactive",
    };

    console.log("📤 Product data to create:", productData);

    // Create product in database
    const productId = await ProductModel.create(productData);
    const product = await ProductModel.findById(productId);

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: product,
    });
  } catch (error: any) {
    console.error("❌ Error creating product:", error);
    console.error("🔍 Error stack:", error.stack);

    // Cleanup any uploaded files
    const files = (req as any).files as Express.Multer.File[];
    if (files && files.length > 0) {
      files.forEach((file: Express.Multer.File) => {
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (e) {
          console.error("Error cleaning up file:", e);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi tạo sản phẩm",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Sửa hàm updateProduct trong productController.ts
export const updateProduct = async (req: Request, res: Response) => {
  console.log("🔍 Update product request received:");
  console.log("  📋 Params:", req.params);
  console.log("  📦 Body keys:", Object.keys(req.body || {}));
  console.log("  📦 Body.existingImages:", req.body?.existingImages);
  console.log("  📦 Body.images:", req.body?.images);
  console.log("  📁 Files:", (req as any).files);
  console.log("  📁 File:", (req as any).file);

  try {
    const { id } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      console.log("❌ Product not found:", id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Xử lý multipart form data nếu có
    let updateData = { ...req.body };

    // Xử lý ảnh nếu có upload (multer.array => req.files is an array)
    const uploadedImages: string[] = [];
    const uploadedFiles = (req as any).files;
    if (
      uploadedFiles &&
      (Array.isArray(uploadedFiles)
        ? uploadedFiles.length > 0
        : Object.keys(uploadedFiles).length > 0)
    ) {
      // If multer.array was used, req.files is an array
      const fileArray = Array.isArray(uploadedFiles)
        ? uploadedFiles
        : // If fields() was used, it may be an object keyed by field name
          uploadedFiles.images || [];

      for (const file of fileArray) {
        try {
          // Multer already wrote the file into the destination; take its relative path
          const rel = `/uploads/products/${path.basename(
            file.path || file.filename || file.originalname
          )}`;
          uploadedImages.push(rel);
        } catch (e) {
          console.warn("Failed to process uploaded file for update:", e);
        }
      }
    }

    // Kết hợp ảnh cũ (existingImages) và ảnh mới (uploadedImages)
    console.log("🖼️ Uploaded images from multer:", uploadedImages);
    console.log("📥 Raw existingImages from body:", updateData.existingImages);
    console.log("📥 Raw images from body:", updateData.images);

    let existingImages: string[] = [];
    try {
      if (updateData.existingImages) {
        existingImages =
          typeof updateData.existingImages === "string"
            ? JSON.parse(updateData.existingImages)
            : updateData.existingImages;
      } else if (typeof updateData.images === "string" && updateData.images) {
        existingImages = JSON.parse(updateData.images);
      } else if (Array.isArray(updateData.images)) {
        existingImages = updateData.images;
      }
    } catch (e) {
      console.warn("Failed to parse existing images:", e);
      existingImages = [];
    }

    console.log("🖼️ Parsed existing images:", existingImages);

    // Combine existing + newly uploaded images - ALWAYS set images field
    const combinedImages = [...existingImages, ...uploadedImages];
    console.log("🔗 Combined images:", combinedImages);

    // Always set images, even if empty (to allow clearing all images)
    updateData.images = combinedImages;

    // Remove existingImages from updateData as it's not a DB field
    delete updateData.existingImages;

    // Parse các trường JSON
    if (
      updateData.specifications &&
      typeof updateData.specifications === "string"
    ) {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {
        updateData.specifications = {};
      }
    }

    if (updateData.tags && typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (e) {
        updateData.tags = [];
      }
    }

    // Chuyển đổi các trường số
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice)
      updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stockQuantity)
      updateData.stockQuantity = parseInt(updateData.stockQuantity);
    if (updateData.featured)
      updateData.featured = updateData.featured === "true";

    // Cập nhật slug nếu name thay đổi
    if (updateData.name && updateData.name !== existingProduct.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }

    console.log("📝 Processed update data:", updateData);

    // Thực hiện cập nhật
    const success = await ProductModel.update(id, updateData);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thất bại hoặc không có thay đổi",
      });
    }

    // Lấy sản phẩm đã cập nhật
    const updatedProduct = await ProductModel.findById(id);

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi cập nhật sản phẩm",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Sửa hàm getProducts để hiển thị thông tin chi tiết hơn
export async function getProducts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string | undefined;

    // Build filter object
    const filter: any = {};

    // Add category filter if provided
    if (category) {
      filter.categoryId = category;
    }

    const { products, total } = await ProductModel.findAll(filter, page, limit);

    // Debug log để kiểm tra images
    console.log(
      "🖼️ [Backend] Products images debug:",
      products.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        images: p.images,
      }))
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({
      success: false,
      message: "Error getting products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
// Return total product count for dashboard
export async function getProductsCount(req: Request, res: Response) {
  const db = require("../database/database").default;
  try {
    // Try counting active products first (newer schema)
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM products WHERE status = 'active'`
    );
    const count = (rows as any)[0]?.count || 0;
    return res.json({ success: true, data: { count } });
  } catch (error: any) {
    // If the `status` column doesn't exist, fall back to counting all products
    const isMissingField =
      error && (error.code === "ER_BAD_FIELD_ERROR" || error.errno === 1054);
    if (isMissingField) {
      try {
        const db2 = require("../database/database").default;
        const [rows] = await db2.execute(
          `SELECT COUNT(*) as count FROM products`
        );
        const count = (rows as any)[0]?.count || 0;
        return res.json({ success: true, data: { count } });
      } catch (err2) {
        console.error("Error getting products count (fallback):", err2);
        return res
          .status(500)
          .json({ success: false, message: "Error getting products count" });
      }
    }

    console.error("Error getting products count:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error getting products count" });
  }
}
export async function getProductById(req: Request, res: Response) {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({ success: false, message: "Error getting product" });
  }
}
export async function deleteProduct(req: Request, res: Response) {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    await ProductModel.delete(req.params.id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Error deleting product" });
  }
}

export async function searchProducts(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }
    const products = await ProductModel.searchProducts(q as string);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error searching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error searching products" });
  }
}
export async function getProductsByCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    const products = await ProductModel.findByCategory(categoryId);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error getting products by category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting products by category" });
  }
}
export async function updateProductStock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    if (typeof stockQuantity !== "number" || stockQuantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid stock quantity" });
    }

    const success = await ProductModel.updateStock(id, stockQuantity);
    if (!success) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating product stock:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating product stock" });
  }
}

export async function getProductBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const product = await ProductModel.findBySlug(slug);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error getting product by slug:", error);
    res.status(500).json({ success: false, message: "Error getting product" });
  }
}

// In productController.ts
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await ProductModel.findFeatured(limit);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error in getFeaturedProducts:", error);
    res.status(500).json({
      success: false,
      message: "Error getting featured products",
    });
  }
};

export async function getBrands(req: Request, res: Response) {
  try {
    const brands = await ProductModel.getBrands();
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error("Error getting brands:", error);
    res.status(500).json({ success: false, message: "Error getting brands" });
  }
}

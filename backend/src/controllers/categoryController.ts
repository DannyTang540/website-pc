// controllers/categories.ts
import { Request, Response } from "express";
import { CategoryModel } from "../models/Category";

// Lấy tất cả categories (dạng tree - cho frontend)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.findAll();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    });
  }
};

// Lấy tất cả categories (dạng flat - cho admin)
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.findAllFlat();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get all categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy category by slug
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const category = await CategoryModel.findBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Tạo category mới
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parentId, status } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    // Check if slug exists
    if (await CategoryModel.isSlugExists(slug)) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const categoryId = await CategoryModel.create({
      name,
      slug,
      description,
      parentId,
      status: status || "active",
    });

    const newCategory = await CategoryModel.findById(categoryId);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Cập nhật category
// export const updateCategory = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { name, slug, description, parentId, status } = req.body;

//     // Check if category exists
//     const existingCategory = await CategoryModel.findById(id);
//     if (!existingCategory) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     // Check if slug exists (excluding current category)
//     if (slug && (await CategoryModel.isSlugExists(slug, id))) {
//       return res.status(400).json({
//         success: false,
//         message: "Slug already exists",
//       });
//     }

//     const updated = await CategoryModel.update(id, {
//       name,
//       slug,
//       description,
//       parentId,
//       status,
//     });

//     if (!updated) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to update category",
//       });
//     }

//     const updatedCategory = await CategoryModel.findById(id);

//     res.json({
//       success: true,
//       message: "Category updated successfully",
//       data: updatedCategory,
//     });
//   } catch (error) {
//     console.error("Update category error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, status } = req.body;

    console.log('📥 Update category request:', { id, body: req.body });

    // Check if category exists
    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if slug exists (excluding current category)
    if (slug && slug !== existingCategory.slug) {
      if (await CategoryModel.isSlugExists(slug, id)) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists",
        });
      }
    }

    // Chuẩn hóa dữ liệu trước khi gửi đến model
    const updateData = {
      name: name || undefined,
      slug: slug || undefined,
      description: description || undefined,
      parentId: parentId === '' ? null : parentId,
      status: status || undefined
    };

    console.log('🔄 Processed update data:', updateData);

    const updated = await CategoryModel.update(id, updateData);

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update category",
      });
    }

    const updatedCategory = await CategoryModel.findById(id);

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("❌ Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Xóa category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has products (you'll need to implement this)
    // const hasProducts = await ProductModel.countByCategory(id);
    // if (hasProducts > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot delete category with products"
    //   });
    // }

    const deleted = await CategoryModel.delete(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete category",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

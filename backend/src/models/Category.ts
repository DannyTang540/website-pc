// models/Category.ts
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  subcategories?: Category[];
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  status?: "active" | "inactive";
}

export class CategoryModel {
  // Lấy tất cả categories với subcategories
  static async findAll(): Promise<Category[]> {
    // Select actual category columns from the schema and build a tree
    const [rows] = await pool.execute(`
      SELECT
        id,
        name,
        slug,
        description,
        image,
        parent_id as parentId,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM categories
      ORDER BY name
    `);

    const categories = (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      parentId: r.parentId,
      status: r.status || "active",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subcategories: [],
    }));

    // Build hierarchical tree from flat list
    return this.buildCategoryTree(categories as Category[]);
  }

  // Xây dựng category tree
  private static buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Tạo map cho dễ truy cập
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Xây dựng tree structure
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parentCategory = categoryMap.get(category.parentId)!;
        if (!parentCategory.subcategories) {
          parentCategory.subcategories = [];
        }
        parentCategory.subcategories.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  // Lấy category by ID
  static async findById(id: string): Promise<Category | null> {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, description, image, parent_id as parentId, status, created_at as createdAt, updated_at as updatedAt FROM categories WHERE id = ?`,
      [id]
    );
    const items = rows as any[];
    if (!items.length) return null;
    const r = items[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      parentId: r.parentId,
      status: r.status || "active",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subcategories: [],
    };
  }

  // Lấy category by slug
  static async findBySlug(slug: string): Promise<Category | null> {
    try {
      const [rows] = await pool.execute(
        `SELECT id, name, slug, description, image, parent_id as parentId, status, created_at as createdAt, updated_at as updatedAt FROM categories WHERE slug = ?`,
        [slug]
      );
      const items = rows as any[];
      if (!items.length) return null;
      const r = items[0];
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        parentId: r.parentId,
        status: r.status || "active",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        subcategories: [],
      };
    } catch (error) {
      // If the schema doesn't have slug-related columns, gracefully return null
      console.warn(
        "findBySlug fallback, returning null due to schema:",
        (error as Error).message
      );
      return null;
    }
  }

  // Tạo category mới
  static async create(categoryData: CreateCategoryData): Promise<string> {
    const id = uuidv4();

    const [result] = await pool.execute(
      `INSERT INTO categories (id, name, slug, description, parent_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        categoryData.name,
        categoryData.slug,
        categoryData.description || null,
        categoryData.parentId || null,
        categoryData.status || "active",
      ]
    );

    return id;
  }

  // Cập nhật category
  static async update(
    id: string,
    categoryData: UpdateCategoryData
  ): Promise<boolean> {
    try {
      // Chuẩn hóa dữ liệu - thay thế undefined bằng null
      const processedData = {
        name: categoryData.name ?? null,
        slug: categoryData.slug ?? null,
        description: categoryData.description ?? null,
        parentId:
          categoryData.parentId === "" ? null : categoryData.parentId ?? null,
        status: categoryData.status ?? null,
      };

      console.log("🔄 Update category with processed data:", {
        id,
        ...processedData,
      });

      const [result] = await pool.execute(
        `UPDATE categories 
       SET name = COALESCE(?, name),
           slug = COALESCE(?, slug),
           description = COALESCE(?, description),
           parent_id = COALESCE(?, parent_id),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ?`,
        [
          processedData.name,
          processedData.slug,
          processedData.description,
          processedData.parentId,
          processedData.status,
          id,
        ]
      );

      const affectedRows = (result as any).affectedRows;
      console.log("✅ Update result - affected rows:", affectedRows);

      return affectedRows > 0;
    } catch (error) {
      console.error("❌ Error in CategoryModel.update:", error);
      throw error;
    }
  }
  // Xóa category (hard delete)
  static async delete(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting category with ID: ${id}`);

      // First, check if category exists
      const category = await this.findById(id);
      if (!category) {
        console.log(`❌ Category with ID ${id} not found`);
        return false;
      }

      // Check if category has subcategories
      const [subcategories] = await pool.execute(
        `SELECT id FROM categories WHERE parent_id = ?`,
        [id]
      );

      if (Array.isArray(subcategories) && subcategories.length > 0) {
        console.log(
          `❌ Cannot delete category with ID ${id} - it has subcategories`
        );
        return false;
      }

      // Check if category has products (you'll need to implement this check)
      // const [products] = await pool.execute(
      //   `SELECT id FROM products WHERE category_id = ? LIMIT 1`,
      //   [id]
      // );
      //
      // if (Array.isArray(products) && products.length > 0) {
      //   console.log(`❌ Cannot delete category with ID ${id} - it has associated products`);
      //   return false;
      // }

      // Perform the delete
      const [result] = await pool.execute(
        `DELETE FROM categories WHERE id = ?`,
        [id]
      );

      const success = (result as any).affectedRows > 0;
      console.log(
        `✅ Category ${id} ${success ? "deleted successfully" : "not found"}`
      );

      return success;
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      throw error;
    }
  }

  // Lấy tất cả categories không phân cấp (cho admin)
  static async findAllFlat(): Promise<Category[]> {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, description, image, parent_id as parentId, status, created_at as createdAt, updated_at as updatedAt FROM categories ORDER BY name`
    );

    return (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      parentId: r.parentId,
      status: r.status || "active",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subcategories: [],
    }));
  }

  // Kiểm tra slug đã tồn tại chưa
  static async isSlugExists(
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let query = `SELECT COUNT(*) as count FROM categories WHERE slug = ?`;
      const params: any[] = [slug];
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      const [rows] = await pool.execute(query, params);
      return (rows as any)[0].count > 0;
    } catch (error) {
      // If slug column doesn't exist, return false (slug cannot exist)
      console.warn(
        "isSlugExists: schema missing slug column, treating as not exists"
      );
      return false;
    }
  }
}

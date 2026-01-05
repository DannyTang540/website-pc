// src/models/Product.ts
import slugify from "slugify";
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  brand: string;
  images: string[];
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  status: "active" | "inactive";
  slug: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilter {
  categoryId?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
  tags?: string[];
  specifications?: Record<string, string | number>;
}

export class ProductModel {
  static async findAll(
    filters: ProductFilter = {},
    page: number = 1,
    limit: number = 12
  ): Promise<{ products: Product[]; total: number }> {
    try {
      console.log("Starting ProductModel.findAll with filters:", filters);

      let whereConditions: string[] = [];
      const params: any[] = [];

      // Build filter conditions
      if (filters.categoryId) {
        whereConditions.push("p.category_id = ?");
        params.push(filters.categoryId);
      }

      if (filters.brand?.length) {
        whereConditions.push(
          `p.brand IN (${filters.brand.map(() => "?").join(",")})`
        );
        params.push(...filters.brand);
      }

      if (filters.minPrice) {
        whereConditions.push("p.price >= ?");
        params.push(Number(filters.minPrice));
      }

      if (filters.maxPrice) {
        whereConditions.push("p.price <= ?");
        params.push(Number(filters.maxPrice));
      }

      if (filters.inStock !== undefined) {
        whereConditions.push("p.stock_quantity > 0");
      }

      if (filters.featured !== undefined) {
        whereConditions.push("p.featured = ?");
        params.push(filters.featured ? 1 : 0);
      }

      if (filters.search) {
        whereConditions.push(
          "(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)"
        );
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Handle tags filter more safely
      if (filters.tags?.length) {
        try {
          const tagConditions = filters.tags.map(() => `p.tags LIKE ?`);
          whereConditions.push(`(${tagConditions.join(" OR ")})`);
          // Search for tags in the JSON array
          params.push(...filters.tags.map((tag) => `%"${tag}"%`));
        } catch (e) {
          console.error("Error processing tags filter:", e);
          throw new Error("Invalid tags filter format");
        }
      }

      // Build the WHERE clause
      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      // Count total matching products
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM products p ${whereClause}`,
        params
      );

      // Add pagination
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(
        `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Process the rows to parse JSON fields
      const processedRows = (rows as any[])
        .map((row) => {
          try {
            // Helper function to safely parse JSON fields
            const safeParse = (value: any, defaultValue: any) => {
              if (value === null || value === undefined) return defaultValue;
              if (typeof value === "object") return value;
              try {
                const parsed = JSON.parse(value);
                // Filter out empty objects and invalid values from arrays
                if (Array.isArray(parsed)) {
                  return parsed.filter((item: any) => {
                    if (typeof item === "string") return item.trim().length > 0;
                    if (typeof item === "object" && item !== null) {
                      return Object.keys(item).length > 0 && item.url;
                    }
                    return false;
                  });
                }
                return parsed;
              } catch (e) {
                console.warn(`Failed to parse JSON for product ${row.id}:`, e);
                return defaultValue;
              }
            };

            const images = safeParse(row.images, []);

            // Process each field
            const processed: any = {
              ...row,
              images: images,
              image: images[0] || null, // First image for backward compatibility
              specifications: safeParse(row.specifications, {}),
              tags: safeParse(row.tags, []),
              inStock: Boolean(row.stock_quantity > 0),
              stockQuantity: Number(row.stock_quantity) || 0,
              categoryId: row.category_id,
              originalPrice: Number(row.original_price || row.price),
              price: Number(row.price),
              featured: Boolean(row.featured),
              status: row.status === "active" ? "active" : "inactive",
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };

            // Ensure required fields have default values
            if (!Array.isArray(processed.images)) processed.images = [];
            if (typeof processed.specifications !== "object")
              processed.specifications = {};
            if (!Array.isArray(processed.tags)) processed.tags = [];

            return processed as Product;
          } catch (e) {
            console.error(`Error processing product ${row.id}:`, e);
            return null;
          }
        })
        .filter(Boolean);

      console.log(`Found ${processedRows.length} products`);

      return {
        products: processedRows as Product[],
        total: Number((countRows as any)[0]?.total) || 0,
      };
    } catch (error) {
      console.error("Error in ProductModel.findAll:", error);
      throw error;
    }
  }

  // In backend/src/models/Product.ts
  static async create(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    try {
      await pool.execute(
        `INSERT INTO products 
       (id, name, description, price, original_price, category_id, brand, 
        images, specifications, in_stock, stock_quantity, featured, slug, tags, 
        created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          productData.name,
          productData.description || "",
          productData.price,
          productData.originalPrice || productData.price,
          productData.categoryId,
          productData.brand || "",
          JSON.stringify(productData.images || []),
          JSON.stringify(productData.specifications || {}),
          Boolean(productData.inStock),
          productData.stockQuantity || 0,
          Boolean(productData.featured),
          productData.slug ||
            slugify(String(productData.name), { lower: true, strict: true }),
          JSON.stringify(productData.tags || []),
          now,
          now,
        ]
      );
      return id;
    } catch (error) {
      console.error("Error in ProductModel.create:", error);
      throw error;
    }
  }
  // Sửa phương thức update trong Product.ts

  static async update(
    id: string,
    data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
  ): Promise<boolean> {
    try {
      console.log("🔄 [Product Model] Updating product:", id);
      console.log(
        "📦 [Product Model] Update data:",
        JSON.stringify(data, null, 2)
      );

      if (!data || typeof data !== "object") {
        throw new Error("Dữ liệu cập nhật không hợp lệ");
      }

      // Kiểm tra sản phẩm tồn tại
      const existingProduct = await this.findById(id);
      if (!existingProduct) {
        throw new Error("Không tìm thấy sản phẩm");
      }

      // Chuẩn bị các trường cập nhật
      const updateFields: string[] = [];
      const params: any[] = [];

      // Map các field từ camelCase sang snake_case cho database
      const fieldMappings: Record<string, string> = {
        name: "name",
        description: "description",
        shortDescription: "short_description",
        price: "price",
        originalPrice: "original_price",
        categoryId: "category_id",
        brand: "brand",
        images: "images",
        specifications: "specifications",
        stock: "stock_quantity",
        stockQuantity: "stock_quantity",
        minimumStock: "minimum_stock",
        status: "status",
        isFeatured: "featured",
        featured: "featured",
        slug: "slug",
        tags: "tags",
      };

      // Xử lý từng field
      Object.entries(data).forEach(([key, value]) => {
        const dbField = fieldMappings[key];
        if (dbField) {
          // Nếu field có trong mapping
          updateFields.push(`${dbField} = ?`);

          // Xử lý các trường đặc biệt
          if (key === "images" || key === "specifications" || key === "tags") {
            // Chuyển đổi thành JSON nếu là object/array
            params.push(JSON.stringify(value));
          }
          // Xử lý trường boolean
          else if (key === "isFeatured" || key === "featured") {
            const isFeatured =
              typeof value === "string"
                ? value.toLowerCase() === "true"
                : Boolean(value);
            params.push(isFeatured ? 1 : 0);
          }
          // Xử lý trường số
          else if (
            [
              "price",
              "originalPrice",
              "stock",
              "stockQuantity",
              "minimumStock",
            ].includes(key)
          ) {
            const stockQty = Number(value) || 0;
            params.push(stockQty);

            // Also update inStock status if needed
            if (!updateFields.includes("in_stock = ?")) {
              updateFields.push("in_stock = ?");
              params.push(stockQty > 0 ? 1 : 0);
            }
          }
          // Xử lý status
          else if (key === "status") {
            params.push(value === "active" ? "active" : "inactive");
          }
          // Các trường khác
          else {
            params.push(value);
          }
        }
      });

      // Thêm updated_at
      updateFields.push("updated_at = ?");
      params.push(new Date());

      // Thêm id cho WHERE clause
      params.push(id);

      if (updateFields.length === 0) {
        console.warn("⚠️ Không có trường nào để cập nhật");
        return false;
      }

      const sql = `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`;
      console.log("📝 [Product Model] SQL:", sql);
      console.log("🔢 [Product Model] Params:", params);

      const [result] = await pool.execute(sql, params);
      const affectedRows = (result as any).affectedRows;

      console.log(
        `✅ [Product Model] Update successful, affected rows: ${affectedRows}`
      );
      return affectedRows > 0;
    } catch (error: any) {
      console.error("❌ [Product Model] Error in update:", error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Product | null> {
    try {
      const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
        id,
      ]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.processRow(rows[0]);
    } catch (error) {
      console.error("Error in ProductModel.findById:", error);
      throw error;
    }
  }

  // Additional methods like update, delete can be added here
  static async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    );
    return rows as Product[];
  }

  static async findBySlug(slug: string): Promise<Product | null> {
    try {
      const [rows] = await pool.execute(
        `SELECT 
        p.*, 
        c.name as category_name,
        COALESCE(
          JSON_UNQUOTE(
            JSON_EXTRACT(p.tags, '$')
          ),
          '[]'
        ) as tags
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?`,
        [slug]
      );

      const products = rows as any[];
      if (!products.length) return null;

      const product = products[0];

      // Helper function to safely parse JSON fields
      const safeJsonParse = (value: any, defaultValue: any = null) => {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === "object") return value;
        try {
          return JSON.parse(value);
        } catch (e: any) {
          console.error("Error parsing JSON:", { value, error: e.message });
          return defaultValue;
        }
      };

      // Process the row to parse JSON fields
      const parsedProduct = {
        ...product,
        images: safeJsonParse(product.images, []),
        specifications: safeJsonParse(product.specifications, {}),
        tags: safeJsonParse(product.tags, []),
        inStock: Boolean(product.in_stock),
        stockQuantity: product.stock_quantity || 0,
        categoryId: product.category_id,
        originalPrice: product.original_price,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      } as Product;

      return parsedProduct;
    } catch (error) {
      console.error("Error in ProductModel.findBySlug:", error);
      throw error;
    }
  }

  static async findByCategory(categoryId: string): Promise<Product[]> {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          p.*, 
          c.name as category_name,
          COALESCE(
            JSON_UNQUOTE(
              JSON_EXTRACT(p.tags, '$')
            ),
            '[]'
          ) as tags
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.category_id = ?`,
        [categoryId]
      );

      // Process the rows to parse JSON fields
      return (rows as any[]).map((row) => ({
        ...row,
        images: row.images ? JSON.parse(row.images) : [],
        specifications: row.specifications
          ? JSON.parse(row.specifications)
          : {},
        tags: row.tags ? JSON.parse(row.tags) : [],
        inStock: Boolean(row.in_stock),
        stockQuantity: row.stock_quantity,
        categoryId: row.category_id,
        originalPrice: row.original_price,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as Product[];
    } catch (error) {
      console.error("Error in ProductModel.findByCategory:", error);
      throw error;
    }
  }

  // In Product.ts, findFeatured method
  static async findFeatured(limit: number = 10): Promise<Product[]> {
    try {
      const sql = `
      SELECT 
        p.*, 
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.featured = 1
      ORDER BY p.created_at DESC
      LIMIT ${parseInt(limit.toString(), 10)}`;

      const [rows] = await pool.execute(sql);

      const processed = (rows as any[]).map((row) => {
        // Simple JSON parse - MySQL JSON columns are already parsed as objects
        const getImages = (value: any): string[] => {
          if (!value) return [];

          // Already an array (MySQL JSON auto-parsed)
          if (Array.isArray(value)) {
            return value
              .filter((item: any) => {
                if (typeof item === "string" && item.trim()) return true;
                if (typeof item === "object" && item?.url) return true;
                return false;
              })
              .map((item: any) => (typeof item === "string" ? item : item.url));
          }

          // String - try to parse as JSON
          if (typeof value === "string") {
            if (!value.trim() || value === "[]") return [];
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return parsed
                  .filter((item: any) => {
                    if (typeof item === "string" && item.trim()) return true;
                    if (typeof item === "object" && item?.url) return true;
                    return false;
                  })
                  .map((item: any) =>
                    typeof item === "string" ? item : item.url
                  );
              }
            } catch {
              // Single URL string
              return [value];
            }
          }

          return [];
        };

        const safeJsonParse = (value: any, defaultValue: any) => {
          if (value === null || value === undefined) return defaultValue;
          if (typeof value === "object") return value;
          try {
            return JSON.parse(value);
          } catch {
            return defaultValue;
          }
        };

        const images = getImages(row.images);
        console.log(
          `[findFeatured] Product: ${row.name}, Raw images:`,
          row.images,
          "Processed images:",
          images
        );

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          shortDescription: row.short_description || "",
          price: parseFloat(row.price),
          originalPrice: row.original_price
            ? parseFloat(row.original_price)
            : undefined,
          categoryId: row.category_id,
          categoryName: row.category_name,
          brand: row.brand,
          images: images,
          image: images[0] || null, // First image for backward compatibility
          specifications: safeJsonParse(row.specifications, {}),
          inStock: row.stock_quantity > 0,
          stockQuantity: row.stock_quantity,
          featured: Boolean(row.featured),
          status: row.status,
          tags: safeJsonParse(row.tags, []),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      return processed;
    } catch (error) {
      console.error("Error in ProductModel.findFeatured:", error);
      throw error;
    }
  }

  private static safeJsonParse(jsonString: string, defaultValue: any) {
    try {
      if (typeof jsonString === "object") return jsonString; // Already parsed
      if (!jsonString) return defaultValue;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", { jsonString, error });
      return defaultValue;
    }
  }
  private static processRow(row: any) {
    const safeJsonParse = (jsonString: any, defaultValue: any) => {
      try {
        // If already an object/array, return as-is
        if (typeof jsonString === "object" && jsonString !== null) {
          return jsonString;
        }
        // If empty or null, return default
        if (!jsonString) return defaultValue;
        // Parse string to JSON
        return JSON.parse(jsonString);
      } catch (e: any) {
        console.warn(`Failed to parse JSON for field:`, {
          value: jsonString,
          error: e.message,
        });
        return defaultValue;
      }
    };

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: row.short_description || "", // Handle missing short_description
      price: parseFloat(row.price),
      originalPrice: row.original_price
        ? parseFloat(row.original_price)
        : undefined,
      categoryId: row.category_id,
      brand: row.brand,
      images: safeJsonParse(row.images, []),
      specifications: safeJsonParse(row.specifications, {}),
      inStock: row.stock_quantity > 0,
      stockQuantity: row.stock_quantity,
      featured: Boolean(row.featured || row.featured === 1),
      isComponent: Boolean(row.is_component || row.is_component === 1),
      status: row.status,
      tags: safeJsonParse(row.tags, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Set absolute stock quantity (admin uses this to set inventory)
  static async updateStock(
    productId: string,
    quantity: number
  ): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE products 
       SET stock_quantity = ?, in_stock = CASE WHEN ? > 0 THEN 1 ELSE 0 END, updated_at = NOW()
       WHERE id = ?`,
      [quantity, quantity, productId]
    );
    return (result as any).affectedRows > 0;
  }

  static async markAsFeatured(
    productId: string,
    featured: boolean
  ): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE products 
       SET featured = ?, updated_at = NOW()
       WHERE id = ?`,
      [featured ? 1 : 0, productId]
    );
    return (result as any).affectedRows > 0;
  }

  static async delete(productId: string): Promise<boolean> {
    const [result] = await pool.execute(`DELETE FROM products WHERE id = ?`, [
      productId,
    ]);
    return (result as any).affectedRows > 0;
  }

  static async getBrands(): Promise<string[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC'
      );
      return (rows as any[]).map((row) => row.brand);
    } catch (error) {
      console.error("Error in ProductModel.getBrands:", error);
      throw error;
    }
  }
}

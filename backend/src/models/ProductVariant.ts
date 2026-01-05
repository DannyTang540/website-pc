import  pool  from "../database/database";

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  stock_quantity: number;
  stock_status: "in_stock" | "out_of_stock" | "preorder";
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  image?: string;
  is_default: boolean;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export class ProductVariantModel {
  static async findById(id: string): Promise<ProductVariant | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM product_variants WHERE id = ?",
      [id]
    );
    return (rows as ProductVariant[])[0] || null;
  }

  static async findByProductId(productId: string): Promise<ProductVariant[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [productId]
    );
    return rows as ProductVariant[];
  }

  static async create(
    variant: Omit<ProductVariant, "id" | "created_at" | "updated_at">
  ): Promise<ProductVariant> {
    const [result] = (await pool.execute(
      `INSERT INTO product_variants 
       (product_id, sku, barcode, price, original_price, cost_price, stock_quantity, 
        stock_status, weight, length, width, height, image, is_default, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        variant.product_id,
        variant.sku,
        variant.barcode,
        variant.price,
        variant.original_price,
        variant.cost_price,
        variant.stock_quantity,
        variant.stock_status,
        variant.weight,
        variant.length,
        variant.width,
        variant.height,
        variant.image,
        variant.is_default ? 1 : 0,
        variant.status,
      ]
    )) as any;
    return result;
  }

  static async update(
    id: string,
    updates: Partial<Omit<ProductVariant, "id" | "created_at" | "updated_at">>
  ): Promise<boolean> {
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) return false;

    values.push(id);

    const [result] = (await pool.execute(
      `UPDATE product_variants SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    )) as any;

    return result.affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = (await pool.execute(
      "DELETE FROM product_variants WHERE id = ?",
      [id]
    )) as any;
    return result.affectedRows > 0;
  }
}

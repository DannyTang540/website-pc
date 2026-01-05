import pool from "../database/database";

export type AttributeType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "boolean";

export interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  type: AttributeType;
  is_filterable: boolean;
  is_required: boolean;
  is_variant_attribute: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export class ProductAttributeModel {
  static async findById(id: string): Promise<ProductAttribute | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM product_attributes WHERE id = ?",
      [id]
    );
    return (rows as ProductAttribute[])[0] || null;
  }

  static async findByCode(code: string): Promise<ProductAttribute | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM product_attributes WHERE code = ?",
      [code]
    );
    return (rows as ProductAttribute[])[0] || null;
  }

  static async findAll(
    filter: {
      is_filterable?: boolean;
      is_variant_attribute?: boolean;
    } = {}
  ): Promise<ProductAttribute[]> {
    let query = "SELECT * FROM product_attributes WHERE 1=1";
    const params: any[] = [];

    if (filter.is_filterable !== undefined) {
      query += " AND is_filterable = ?";
      params.push(filter.is_filterable ? 1 : 0);
    }

    if (filter.is_variant_attribute !== undefined) {
      query += " AND is_variant_attribute = ?";
      params.push(filter.is_variant_attribute ? 1 : 0);
    }

    query += " ORDER BY display_order ASC, name ASC";

    const [rows] = await pool.execute(query, params);
    return rows as ProductAttribute[];
  }

  static async create(
    attribute: Omit<ProductAttribute, "id" | "created_at" | "updated_at">
  ): Promise<ProductAttribute> {
    const [result] = (await pool.execute(
      `INSERT INTO product_attributes 
       (name, code, type, is_filterable, is_required, is_variant_attribute, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        attribute.name,
        attribute.code,
        attribute.type,
        attribute.is_filterable ? 1 : 0,
        attribute.is_required ? 1 : 0,
        attribute.is_variant_attribute ? 1 : 0,
        attribute.display_order || 0,
      ]
    )) as any;

    return {
      ...attribute,
      id: result.insertId.toString(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  static async update(
    id: string,
    updates: Partial<
      Omit<ProductAttribute, "id" | "code" | "created_at" | "updated_at">
    >
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
      `UPDATE product_attributes SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    )) as any;

    return result.affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = (await pool.execute(
      "DELETE FROM product_attributes WHERE id = ?",
      [id]
    )) as any;
    return result.affectedRows > 0;
  }
}

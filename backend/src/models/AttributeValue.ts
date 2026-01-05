import  pool  from "../database/database";

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export class AttributeValueModel {
  static async findById(id: string): Promise<AttributeValue | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM attribute_values WHERE id = ?",
      [id]
    );
    return (rows as AttributeValue[])[0] || null;
  }

  static async findByAttributeId(
    attributeId: string
  ): Promise<AttributeValue[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY display_order, value",
      [attributeId]
    );
    return rows as AttributeValue[];
  }

  static async findByAttributeCode(
    attributeCode: string
  ): Promise<AttributeValue[]> {
    const [rows] = await pool.execute(
      `SELECT av.* FROM attribute_values av
       JOIN product_attributes pa ON av.attribute_id = pa.id
       WHERE pa.code = ?
       ORDER BY av.display_order, av.value`,
      [attributeCode]
    );
    return rows as AttributeValue[];
  }

  static async create(
    value: Omit<AttributeValue, "id" | "created_at" | "updated_at">
  ): Promise<AttributeValue> {
    const [result] = (await pool.execute(
      `INSERT INTO attribute_values 
       (attribute_id, value, display_order)
       VALUES (?, ?, ?)`,
      [value.attribute_id, value.value, value.display_order || 0]
    )) as any;

    const newValue = await this.findById(result.insertId);
    if (!newValue) throw new Error('Failed to create attribute value');
    return newValue;
  }

  static async update(
    id: string,
    updates: Partial<
      Omit<AttributeValue, "id" | "attribute_id" | "created_at" | "updated_at">
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
      `UPDATE attribute_values SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    )) as any;

    return result.affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = (await pool.execute(
      "DELETE FROM attribute_values WHERE id = ?",
      [id]
    )) as any;
    return result.affectedRows > 0;
  }
}

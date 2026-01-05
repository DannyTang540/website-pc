// models/Promotion.ts
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface Promotion {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export class PromotionModel {
  static async findAll(): Promise<Promotion[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM promotions ORDER BY created_at DESC`
    );
    return rows as Promotion[];
  }

  static async findById(id: string): Promise<Promotion | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM promotions WHERE id = ?`,
      [id]
    );
    const promotions = rows as Promotion[];
    return promotions.length ? promotions[0] : null;
  }

  static async findByCode(code: string): Promise<Promotion | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM promotions WHERE code = ? AND status = 'active' 
       AND start_date <= NOW() AND end_date >= NOW() 
       AND (usage_limit = 0 OR used_count < usage_limit)`,
      [code]
    );
    const promotions = rows as Promotion[];
    return promotions.length ? promotions[0] : null;
  }

  static async create(promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const [result] = await pool.execute(
      `INSERT INTO promotions (id, code, type, value, min_order_amount, start_date, end_date, usage_limit, used_count, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        promotionData.code,
        promotionData.type,
        promotionData.value,
        promotionData.minOrderAmount,
        promotionData.startDate,
        promotionData.endDate,
        promotionData.usageLimit,
        promotionData.usedCount,
        promotionData.status
      ]
    );
    return id;
  }

  static async update(id: string, promotionData: Partial<Promotion>): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE promotions 
       SET code = ?, type = ?, value = ?, min_order_amount = ?, start_date = ?, end_date = ?, 
           usage_limit = ?, used_count = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        promotionData.code,
        promotionData.type,
        promotionData.value,
        promotionData.minOrderAmount,
        promotionData.startDate,
        promotionData.endDate,
        promotionData.usageLimit,
        promotionData.usedCount,
        promotionData.status,
        id
      ]
    );
    return (result as any).affectedRows > 0;
  }

  static async incrementUsage(code: string): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE promotions SET used_count = used_count + 1, updated_at = NOW() WHERE code = ?`,
      [code]
    );
    return (result as any).affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute(
      `DELETE FROM promotions WHERE id = ?`,
      [id]
    );
    return (result as any).affectedRows > 0;
  }
}
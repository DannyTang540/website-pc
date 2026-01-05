// models/Banner.ts
import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BannerModel {
  static async findAll(): Promise<Banner[]> {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM banners WHERE active = TRUE ORDER BY created_at DESC`
      );
      return (rows as any[]).map(row => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        image: row.image || '',
        link: row.link || null,
        buttonText: row.button_text || null,
        isActive: row.active || false,
        order: row.display_order || 0,
        startDate: row.start_date ? new Date(row.start_date) : new Date(),
        endDate: row.end_date ? new Date(row.end_date) : new Date(),
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    } catch (error) {
      console.error('Error in BannerModel.findAll:', error);
      throw error;
    }
  }

  static async findAllAdmin(): Promise<Banner[]> {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM banners ORDER BY created_at DESC`
      );
      return (rows as any[]).map(row => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        image: row.image || '',
        link: row.link || null,
        buttonText: row.button_text || null,
        isActive: row.active || false,
        order: row.display_order || 0,
        startDate: row.start_date ? new Date(row.start_date) : new Date(),
        endDate: row.end_date ? new Date(row.end_date) : new Date(),
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    } catch (error) {
      console.error('Error in BannerModel.findAllAdmin:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Banner | null> {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM banners WHERE id = ?`,
        [id]
      );
      const row = (rows as any[])[0];
      if (!row) return null;
      return {
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        image: row.image || '',
        link: row.link || null,
        buttonText: row.button_text || null,
        isActive: row.active || false,
        order: row.display_order || 0,
        startDate: row.start_date ? new Date(row.start_date) : new Date(),
        endDate: row.end_date ? new Date(row.end_date) : new Date(),
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      };
    } catch (error) {
      console.error('Error in BannerModel.findById:', error);
      throw error;
    }
  }

  static async create(bannerData: any): Promise<string> {
    try {
      const id = uuidv4();
      // Map frontend fields to database columns
      const [result] = await pool.execute(
        `INSERT INTO banners (id, title, image, link, active, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          id,
          bannerData.title || bannerData.name || '',
          bannerData.imageUrl || bannerData.image || '',
          bannerData.targetUrl || bannerData.link || null,
          bannerData.isActive !== undefined ? bannerData.isActive : true,
        ]
      );
      return id;
    } catch (error) {
      console.error('Error in BannerModel.create:', error);
      throw error;
    }
  }

  static async update(id: string, bannerData: any): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (bannerData.title !== undefined || bannerData.name !== undefined) {
        fields.push('title = ?');
        values.push(bannerData.title || bannerData.name);
      }
      if (bannerData.imageUrl !== undefined || bannerData.image !== undefined) {
        fields.push('image = ?');
        values.push(bannerData.imageUrl || bannerData.image);
      }
      if (bannerData.targetUrl !== undefined || bannerData.link !== undefined) {
        fields.push('link = ?');
        values.push(bannerData.targetUrl || bannerData.link || null);
      }
      if (bannerData.isActive !== undefined) {
        fields.push('active = ?');
        values.push(bannerData.isActive);
      }
      
      if (fields.length === 0) return false;
      
      values.push(id);
      const [result] = await pool.execute(
        `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error in BannerModel.update:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute(
      `DELETE FROM banners WHERE id = ?`,
      [id]
    );
    return (result as any).affectedRows > 0;
  }
}
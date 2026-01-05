import pool from "../database/database";
import { v4 as uuidv4 } from "uuid";

export enum ComponentType {
  CPU = "CPU",
  Main = "Main",
  RAM = "RAM",
  SSD = "SSD",
  PSU = "PSU",
  FAN = "FAN",
  VGA = "VGA",
  Case = "Case",
}

export interface Component {
  id: string;
  type: ComponentType;
  name: string;
  attributes?: Record<string, any>;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export class ComponentModel {
  static async findAll(type?: ComponentType): Promise<Component[]> {
    if (type) {
      const [rows] = await pool.execute(
        `SELECT * FROM components WHERE type = ? AND status = 'active' ORDER BY name`,
        [type]
      );
      return (rows as any[]).map((r) => ({
        ...r,
        attributes: r.attributes ? JSON.parse(r.attributes) : {},
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    const [rows] = await pool.execute(
      `SELECT * FROM components WHERE status = 'active' ORDER BY type, name`
    );
    return (rows as any[]).map((r) => ({
      ...r,
      attributes: r.attributes ? JSON.parse(r.attributes) : {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  static async findById(id: string): Promise<Component | null> {
    const [rows] = await pool.execute(`SELECT * FROM components WHERE id = ?`, [
      id,
    ]);
    const items = rows as any[];
    if (!items.length) return null;
    const r = items[0];
    return {
      ...r,
      attributes: r.attributes ? JSON.parse(r.attributes) : {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  static async findByType(type: string) {
    // Use the generic findAll helper which already handles parsing and ordering
    return this.findAll(type as ComponentType);
  }

  static async create(
    data: Omit<Component, "id" | "created_at" | "updated_at">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    await pool.execute(
      `INSERT INTO components (id, type, name, attributes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.type,
        data.name,
        JSON.stringify(data.attributes || {}),
        data.status || "active",
        now,
        now,
      ]
    );
    return id;
  }

  static async update(
    id: string,
    data: Partial<Omit<Component, "id" | "createdAt" | "updatedAt">>
  ): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.type !== undefined) {
      updates.push("type = ?");
      params.push(data.type);
    }
    if (data.attributes !== undefined) {
      updates.push("attributes = ?");
      params.push(JSON.stringify(data.attributes || {}));
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      params.push(data.status);
    }
    if (updates.length === 0) return true;
    updates.push("updated_at = ?");
    params.push(new Date());
    params.push(id);

    const [result] = await pool.execute(
      `UPDATE components SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    return (result as any).affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE components SET status = 'inactive', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return (result as any).affectedRows > 0;
  }
}

export default ComponentModel;

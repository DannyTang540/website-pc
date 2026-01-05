// models/User.ts
import pool from "../database/database";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export interface AddressRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
  type?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  ward?: string | null;
  role: "user" | "admin";
  points: number;
  membership: "bronze" | "silver" | "gold" | "platinum" | "none";
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho xác thực (có password)
export interface UserWithPassword extends User {
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  role?: "user" | "admin";
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<string> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (id, first_name, last_name, email, password, phone, avatar, role, points, membership, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        userData.firstName,
        userData.lastName,
        userData.email,
        hashedPassword,
        userData.phone,
        userData.avatar || null,
        userData.role || "user",
        0,
        "none",
      ]
    );

    return id;
  }

  // Addresses stored as JSON in users.address (TEXT). Provide helpers to manage them.
  static async getAddresses(userId: string): Promise<AddressRecord[]> {
    const [rows] = await pool.execute(
      `SELECT address FROM users WHERE id = ?`,
      [userId]
    );
    const results = rows as any[];
    if (!results.length) return [];
    const addrText = results[0].address;
    if (!addrText) return [];
    try {
      const parsed = JSON.parse(addrText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  static async saveAddresses(
    userId: string,
    addresses: AddressRecord[]
  ): Promise<boolean> {
    const json = JSON.stringify(addresses);
    const [result] = await pool.execute(
      `UPDATE users SET address = ?, updated_at = NOW() WHERE id = ?`,
      [json, userId]
    );
    return (result as any).affectedRows > 0;
  }

  // Phương thức này cần trả về UserWithPassword để so sánh password
  static async findByEmail(email: string): Promise<UserWithPassword | null> {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        email,
        first_name as firstName,
        last_name as lastName, 
        phone,
        address,
        city,
        district,
        ward,
        avatar,
        password,
        role,
        points,
        membership,
        created_at as createdAt,
        updated_at as updatedAt
       FROM users WHERE email = ?`,
      [email]
    );
    const users = rows as UserWithPassword[];
    return users.length ? users[0] : null;
  }

  // Phương thức này chỉ trả về User (không có password)
  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        email,
        first_name as firstName,
        last_name as lastName,
        phone,
        address,
        city,
        district,
        ward,
        avatar,
        role,
        points,
        membership,
        created_at as createdAt,
        updated_at as updatedAt
       FROM users WHERE id = ?`,
      [id]
    );
    const users = rows as User[];
    return users.length ? users[0] : null;
  }

  static async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Thêm phương thức để đổi password
  static async updatePassword(
    userId: string,
    newPassword: string
  ): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, userId]
    );
    return (result as any).affectedRows > 0;
  }

  static async updateProfile(
    userId: string,
    data: Partial<CreateUserData & { avatar?: string }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.firstName) {
      fields.push("first_name = ?");
      params.push(data.firstName);
    }
    if (data.lastName) {
      fields.push("last_name = ?");
      params.push(data.lastName);
    }
    if (data.phone) {
      fields.push("phone = ?");
      params.push(data.phone);
    }
    if (data.avatar) {
      fields.push("avatar = ?");
      params.push(data.avatar);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = NOW()");
    params.push(userId);

    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    return (result as any).affectedRows > 0;
  }
}

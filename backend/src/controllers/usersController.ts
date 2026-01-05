import { Request, Response } from "express";
import { UserModel } from "../models/User";

export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
    const count = (rows as any[])[0]?.count ?? 0;
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error("Get users count error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20;
    const offset = (page - 1) * limit;

    const users = await (async () => {
      const pool = (await import("../database/database")).default;
      const [rows] = await pool.query(
        `SELECT id, email, first_name as firstName, last_name as lastName, phone, avatar, role, points, membership, created_at as createdAt, updated_at as updatedAt
         FROM users
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows as any[];
    })();

    const total = await (async () => {
      const pool = (await import("../database/database")).default;
      const [rows] = await pool.query(`SELECT COUNT(*) as total FROM users`);
      return (rows as any[])[0]?.total ?? 0;
    })();

    res.json({ success: true, data: users, total, page, limit });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const pool = (await import("../database/database")).default;
    const [result] = await pool.execute(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      [role, req.params.id]
    );
    res.json({ success: true, message: "Role updated" });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    await pool.execute(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      ["blocked", req.params.id]
    );
    res.json({ success: true, message: "User blocked" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    await pool.execute(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      ["user", req.params.id]
    );
    res.json({ success: true, message: "User unblocked" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    await pool.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

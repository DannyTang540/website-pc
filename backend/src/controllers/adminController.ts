import { Request, Response } from "express";
import { getConnection } from "../database/database";

// POST /api/admin/cleanup-sample-data
export const cleanupSampleData = async (req: Request, res: Response) => {
  let conn: any;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // Order matters due to FK constraints
    await conn.query("DELETE FROM order_items");
    await conn.query("DELETE FROM orders");
    await conn.query("DELETE FROM reviews");
    await conn.query("DELETE FROM wishlists");
    await conn.query("DELETE FROM banners");
    await conn.query("DELETE FROM products");
    await conn.query("DELETE FROM components");
    await conn.query("DELETE FROM categories");
    await conn.query("DELETE FROM users WHERE role != 'admin'");

    await conn.commit();
    conn.release();

    res.json({ success: true, message: "Sample/demo data removed." });
  } catch (err: any) {
    if (conn) {
      try {
        await conn.rollback();
        conn.release();
      } catch (e) {
        // ignore
      }
    }
    console.error("Error cleaning sample data:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove sample data." });
  }
};

export default {
  cleanupSampleData,
};

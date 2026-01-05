import { Request, Response } from "express";

export const getInventory = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    const [rows] = await pool.execute(
      "SELECT id, name, stock_quantity as stockQuantity FROM products ORDER BY name ASC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLowStock = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    const [rows] = await pool.execute(
      "SELECT id, name, stock_quantity as stockQuantity FROM products WHERE stock_quantity <= 5"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateInventoryStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params as any;
    const { currentStock } = req.body;
    const pool = (await import("../database/database")).default;
    await pool.execute(
      "UPDATE products SET stock_quantity = ?, in_stock = CASE WHEN ? > 0 THEN 1 ELSE 0 END, updated_at = NOW() WHERE id = ?",
      [currentStock, currentStock, productId]
    );
    res.json({ success: true, message: "Stock updated" });
  } catch (error) {
    console.error("Update inventory stock error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

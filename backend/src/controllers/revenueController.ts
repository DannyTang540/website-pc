import { Request, Response } from "express";
import pool from "../database/database";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(first ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isBadFieldError = (err: any) =>
  err?.code === "ER_BAD_FIELD_ERROR" || err?.errno === 1054;

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const { period = "month", startDate, endDate } = req.query;

    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = "AND DATE(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    } else {
      // Default to period-based filtering
      switch (period) {
        case "day":
          dateFilter = "AND DATE(created_at) = CURDATE()";
          break;
        case "week":
          dateFilter = "AND YEARWEEK(created_at) = YEARWEEK(CURDATE())";
          break;
        case "month":
          dateFilter =
            "AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
          break;
        case "year":
          dateFilter = "AND YEAR(created_at) = YEAR(CURDATE())";
          break;
      }
    }

    const baseQuery = `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orderCount,
        SUM(total) as revenue
      FROM orders 
      WHERE (status IN ('delivered','completed') OR is_delivered = TRUE) ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC`;

    let rows: any;
    try {
      [rows] = await pool.execute(baseQuery, params);
    } catch (err: any) {
      if (!isBadFieldError(err)) throw err;
      const fallbackQuery = baseQuery.replace(
        "(status IN ('delivered','completed') OR is_delivered = TRUE)",
        "status IN ('delivered','completed')"
      );
      [rows] = await pool.execute(fallbackQuery, params);
    }

    const normalized = (rows as any[]).map((r) => ({
      ...r,
      orderCount: Number(r.orderCount) || 0,
      revenue: Number(r.revenue) || 0,
    }));

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("Get revenue stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOverview = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;

    // Total revenue and orders
    const totalBase = `SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue
      FROM orders 
      WHERE (status IN ('delivered','completed') OR is_delivered = TRUE)`;
    let totalRows: any;
    try {
      [totalRows] = await pool.execute(totalBase);
    } catch (err: any) {
      if (!isBadFieldError(err)) throw err;
      [totalRows] = await pool.execute(
        totalBase.replace(
          "(status IN ('delivered','completed') OR is_delivered = TRUE)",
          "status IN ('delivered','completed')"
        )
      );
    }
    const total = (totalRows as any[])[0];

    // Today's revenue and orders
    const todayBase = `SELECT 
        COUNT(*) as todayOrders,
        COALESCE(SUM(total), 0) as todayRevenue
      FROM orders 
      WHERE (status IN ('delivered','completed') OR is_delivered = TRUE) AND DATE(created_at) = CURDATE()`;
    let todayRows: any;
    try {
      [todayRows] = await pool.execute(todayBase);
    } catch (err: any) {
      if (!isBadFieldError(err)) throw err;
      [todayRows] = await pool.execute(
        todayBase.replace(
          "(status IN ('delivered','completed') OR is_delivered = TRUE)",
          "status IN ('delivered','completed')"
        )
      );
    }
    const today = (todayRows as any[])[0];

    // This month's revenue and orders
    const monthBase = `SELECT 
        COUNT(*) as monthlyOrders,
        COALESCE(SUM(total), 0) as monthlyRevenue
      FROM orders 
      WHERE (status IN ('delivered','completed') OR is_delivered = TRUE)
      AND YEAR(created_at) = YEAR(CURDATE()) 
      AND MONTH(created_at) = MONTH(CURDATE())`;
    let monthRows: any;
    try {
      [monthRows] = await pool.execute(monthBase);
    } catch (err: any) {
      if (!isBadFieldError(err)) throw err;
      [monthRows] = await pool.execute(
        monthBase.replace(
          "(status IN ('delivered','completed') OR is_delivered = TRUE)",
          "status IN ('delivered','completed')"
        )
      );
    }
    const month = (monthRows as any[])[0];

    res.json({
      success: true,
      data: {
        totalRevenue: Number(total.totalRevenue) || 0,
        totalOrders: Number(total.totalOrders) || 0,
        todayRevenue: Number(today.todayRevenue) || 0,
        todayOrders: Number(today.todayOrders) || 0,
        monthlyRevenue: Number(month.monthlyRevenue) || 0,
        monthlyOrders: Number(month.monthlyOrders) || 0,
      },
    });
  } catch (error) {
    console.error("Get revenue overview error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 10, period = "month" } = req.query;
    const safeLimit = clamp(parsePositiveInt(limit, 10), 1, 100);

    let dateFilter = "";
    switch (period) {
      case "day":
        dateFilter = "AND DATE(o.created_at) = CURDATE()";
        break;
      case "week":
        dateFilter = "AND YEARWEEK(o.created_at) = YEARWEEK(CURDATE())";
        break;
      case "month":
        dateFilter =
          "AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())";
        break;
      case "year":
        dateFilter = "AND YEAR(o.created_at) = YEAR(CURDATE())";
        break;
    }

    const baseQuery = `SELECT 
        p.id as productId,
        p.name as productName,
        SUM(oi.quantity) as totalSold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      INNER JOIN products p ON oi.product_id = p.id
      WHERE (o.status IN ('delivered','completed') OR o.is_delivered = TRUE) ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY totalSold DESC
      LIMIT ${safeLimit}`;

    let rows: any;
    try {
      [rows] = await pool.execute(baseQuery);
    } catch (err: any) {
      if (!isBadFieldError(err)) throw err;
      const fallbackQuery = baseQuery.replace(
        "(o.status IN ('delivered','completed') OR o.is_delivered = TRUE)",
        "o.status IN ('delivered','completed')"
      );
      [rows] = await pool.execute(fallbackQuery);
    }

    const normalized = (rows as any[]).map((r) => ({
      ...r,
      totalSold: Number(r.totalSold) || 0,
      revenue: Number(r.revenue) || 0,
    }));

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("Get top products error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

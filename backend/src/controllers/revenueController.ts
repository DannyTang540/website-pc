import { Request, Response } from "express";
import pool from "../database/database";

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
          dateFilter = "AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
          break;
        case "year":
          dateFilter = "AND YEAR(created_at) = YEAR(CURDATE())";
          break;
      }
    }

    const [rows] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orderCount,
        SUM(total) as revenue
      FROM orders 
      WHERE status = 'delivered' ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get revenue stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOverview = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    
    // Total revenue and orders
    const [totalRows] = await pool.execute(
      `SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue
      FROM orders 
      WHERE status = 'delivered'`
    );
    const total = (totalRows as any[])[0];

    // Today's revenue and orders
    const [todayRows] = await pool.execute(
      `SELECT 
        COUNT(*) as todayOrders,
        COALESCE(SUM(total), 0) as todayRevenue
      FROM orders 
      WHERE status = 'delivered' AND DATE(created_at) = CURDATE()`
    );
    const today = (todayRows as any[])[0];

    // This month's revenue and orders
    const [monthRows] = await pool.execute(
      `SELECT 
        COUNT(*) as monthlyOrders,
        COALESCE(SUM(total), 0) as monthlyRevenue
      FROM orders 
      WHERE status = 'delivered' 
      AND YEAR(created_at) = YEAR(CURDATE()) 
      AND MONTH(created_at) = MONTH(CURDATE())`
    );
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
    
    let dateFilter = "";
    switch (period) {
      case "day":
        dateFilter = "AND DATE(o.created_at) = CURDATE()";
        break;
      case "week":
        dateFilter = "AND YEARWEEK(o.created_at) = YEARWEEK(CURDATE())";
        break;
      case "month":
        dateFilter = "AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())";
        break;
      case "year":
        dateFilter = "AND YEAR(o.created_at) = YEAR(CURDATE())";
        break;
    }

    const [rows] = await pool.execute(
      `SELECT 
        p.id as productId,
        p.name as productName,
        SUM(oi.quantity) as totalSold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      INNER JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'delivered' ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY totalSold DESC
      LIMIT ?`,
      [Number(limit)]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get top products error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

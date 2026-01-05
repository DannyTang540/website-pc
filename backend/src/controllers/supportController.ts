import { Request, Response } from "express";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const pool = (await import("../database/database")).default;
    const [rows] = await pool.execute(
      "SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get support messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const replyMessage = async (req: Request, res: Response) => {
  try {
    // Stub: in real app record reply
    res.json({ success: true, message: "Reply recorded (mock)" });
  } catch (error) {
    console.error("Reply support error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

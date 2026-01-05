// middleware/admin.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }
  next();
};
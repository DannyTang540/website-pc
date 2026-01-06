import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    console.error("Auth misconfigured: missing JWT_SECRET");
    return res.status(500).json({ message: "Auth not configured" });
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.userId = decoded?.id || decoded?.userId || decoded?.sub;
    req.userRole = decoded?.role;
    next();
  });
};

// THÊM MIDDLEWARE isAdmin VÀO ĐÂY
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userRole) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

// NẾU CẦN, CÓ THỂ THÊM THÊM MIDDLEWARE PHÂN QUYỀN KHÁC
export const isUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.userRole !== "user" && req.userRole !== "admin") {
    return res.status(403).json({ message: "User access required" });
  }

  next();
};

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// THÊM MIDDLEWARE isAdmin VÀO ĐÂY
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

// NẾU CẦN, CÓ THỂ THÊM THÊM MIDDLEWARE PHÂN QUYỀN KHÁC
export const isUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.userRole !== 'user' && req.userRole !== 'admin') {
    return res.status(403).json({ message: "User access required" });
  }
  
  next();
};
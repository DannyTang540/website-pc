// controllers/auth.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

const getJwtSecrets = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  return { jwtSecret, jwtRefreshSecret };
};

const toSafeErrorLog = (error: any) => ({
  message: error?.message,
  code: error?.code,
  errno: error?.errno,
  sqlState: error?.sqlState,
  sqlMessage: error?.sqlMessage,
  stack: error?.stack,
});

// Đăng nhập người dùng
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const { jwtSecret, jwtRefreshSecret } = getJwtSecrets();
    if (!jwtSecret || !jwtRefreshSecret) {
      console.error("Auth misconfigured: missing JWT secrets", {
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
      });
      return res.status(500).json({ message: "Auth not configured" });
    }

    const user = await UserModel.findByEmail(email);
    if (!user || !(await UserModel.comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign({ id: user.id }, jwtRefreshSecret, {
      expiresIn: "7d",
    });

    // Trả về đúng format frontend cần
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: (user as any).address || null,
        city: (user as any).city || null,
        district: (user as any).district || null,
        ward: (user as any).ward || null,
        avatar: user.avatar,
        role: user.role,
        points: user.points,
        membership: user.membership,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", toSafeErrorLog(error));
    res.status(500).json({ message: "Server error" });
  }
};

// Đăng ký người dùng mới
export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  try {
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({ message: "Invalid registration data" });
    }

    const { jwtSecret, jwtRefreshSecret } = getJwtSecrets();
    if (!jwtSecret || !jwtRefreshSecret) {
      console.error("Auth misconfigured: missing JWT secrets", {
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
      });
      return res.status(500).json({ message: "Auth not configured" });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUserId = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: "user",
    });

    // Lấy thông tin user vừa tạo
    const user = await UserModel.findById(newUserId);
    if (!user) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    // Tạo tokens
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign({ id: user.id }, jwtRefreshSecret, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: (user as any).address || null,
        city: (user as any).city || null,
        district: (user as any).district || null,
        ward: (user as any).ward || null,
        avatar: user.avatar,
        role: user.role,
        points: user.points,
        membership: user.membership,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Register error:", toSafeErrorLog(error));
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: (user as any).address || null,
      city: (user as any).city || null,
      district: (user as any).district || null,
      ward: (user as any).ward || null,
      avatar: user.avatar,
      role: user.role,
      points: user.points,
      membership: user.membership,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Get current user error:", toSafeErrorLog(error));
    res.status(500).json({ message: "Server error" });
  }
};

// Đăng xuất người dùng
export const logout = (req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    const { jwtSecret, jwtRefreshSecret } = getJwtSecrets();
    if (!jwtSecret || !jwtRefreshSecret) {
      console.error("Auth misconfigured: missing JWT secrets", {
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
      });
      return res.status(500).json({ message: "Auth not configured" });
    }

    const payload: any = jwt.verify(refreshToken, jwtRefreshSecret) as any;
    const user = await UserModel.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });
    const newRefresh = jwt.sign({ id: user.id }, jwtRefreshSecret, {
      expiresIn: "7d",
    });

    res.json({ token, refreshToken: newRefresh });
  } catch (error) {
    console.error("Refresh token error:", toSafeErrorLog(error));
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const updated = await UserModel.updateProfile(userId, {
      firstName,
      lastName,
      phone,
      avatar,
    });
    if (!updated)
      return res.status(400).json({ message: "No changes or update failed" });
    const user = await UserModel.findById(userId);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Update profile error:", toSafeErrorLog(error));
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { currentPassword, newPassword } = req.body;
  try {
    const userWithPass = (await UserModel.findById(userId)) as any;
    // Need to fetch password via findByEmail or findById with password; fallback: findByEmail via stored email
    const userWithPassword = await UserModel.findByEmail(userWithPass.email);
    if (
      !userWithPassword ||
      !(await UserModel.comparePassword(
        currentPassword,
        userWithPassword.password
      ))
    ) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const updated = await UserModel.updatePassword(userId, newPassword);
    if (!updated)
      return res.status(500).json({ message: "Failed to update password" });
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", toSafeErrorLog(error));
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot password (simple stub)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  // In real app: create reset token, send email. Here we return success for compatibility.
  console.log("Forgot password requested for", email);
  res.json({
    success: true,
    message: "If the email exists, a reset link was sent",
  });
};

// Reset password (simple stub)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  // In real app: validate token and update password. Here return success for compatibility.
  console.log("Reset password with token", token);
  res.json({ success: true, message: "Password has been reset (mock)" });
};

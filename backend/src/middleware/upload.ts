// middleware/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Tạo thư mục upload nếu chưa tồn tại
const createUploadDirs = () => {
  const baseDir = path.join(process.cwd(), "public", "uploads");
  const dirs = ["banners", "products", "users", "general"];

  dirs.forEach((dir) => {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  return baseDir;
};

const uploadDir = createUploadDirs();

// Cấu hình lưu trữ

// Kiểm tra loại file
// const fileFilter = (
//   req: Request,
//   file: Express.Multer.File,
//   cb: multer.FileFilterCallback
// ) => {
//   const allowedTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
//   const ext = path.extname(file.originalname).toLowerCase();

//   if (allowedTypes.includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(
//       new Error(
//         "Định dạng file không hợp lệ. Chỉ chấp nhận jpg, jpeg, png, gif, webp."
//       )
//     );
//   }
// };

// Cấu hình multer
// Trong upload.ts
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Always write into the same uploads directory that the app serves:
    // process.cwd()/public/uploads
    let subDir = "general";

    // Route/field-based routing for common cases
    if (file.fieldname === "images" || req.baseUrl?.includes("/products")) {
      subDir = "products";
    } else if (
      req.baseUrl?.includes("/banners") ||
      file.fieldname === "banner"
    ) {
      subDir = "banners";
    } else if (req.baseUrl?.includes("/users") || file.fieldname === "avatar") {
      subDir = "users";
    }

    const uploadPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh!"), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

export const multerInstance = upload;

// Xử lý upload single file
export const handleSingleUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "Kích thước file quá lớn. Tối đa 5MB.",
          });
        }
        if (
          err.message &&
          err.message.includes("Định dạng file không hợp lệ")
        ) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: "Tải lên thất bại",
        });
      }
      next();
    });
  };
};

export const handleMultipleUpload = (
  fieldName: string = "images",
  maxCount: number = 10
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(
      "📤 [Upload Middleware] Processing upload for field:",
      fieldName
    );
    console.log(
      "📤 [Upload Middleware] Content-Type:",
      req.headers["content-type"]
    );

    multerInstance.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err) {
        console.error("❌ [Upload Middleware] Multer error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "Kích thước file quá lớn. Tối đa 5MB.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: `Vượt quá số lượng file tối đa. Tối đa ${maxCount} file.`,
          });
        }
        if (
          err.message &&
          err.message.includes("Định dạng file không hợp lệ")
        ) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: "Tải lên thất bại",
          error: err.message,
        });
      }

      // Log successful upload processing
      const files = (req as any).files;
      console.log("✅ [Upload Middleware] Files received:", files?.length || 0);
      if (files && files.length > 0) {
        files.forEach((f: any) =>
          console.log("  📁", f.filename, f.size, "bytes")
        );
      }

      next();
    });
  };
};

// Middleware xử lý lỗi cho fields upload
export const handleFieldsUpload = (fields: multer.Field[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    multerInstance.fields(fields)(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "Kích thước file quá lớn. Tối đa 5MB.",
          });
        }
        if (
          err.message &&
          err.message.includes("Định dạng file không hợp lệ")
        ) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: "Tải lên thất bại",
          error: err.message,
        });
      }
      next();
    });
  };
};

// database.ts - CẬP NHẬT MỚI
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Hàm lấy cấu hình database với ưu tiên Railway
const getDbConfig = () => {
  // Ưu tiên 1: DATABASE_URL từ Railway
  if (process.env.DATABASE_URL) {
    console.log("📦 Using DATABASE_URL from Railway");
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
      acquireTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
    };
  }

  // Ưu tiên 2: Biến MYSQL từ Railway
  if (process.env.MYSQLHOST) {
    console.log("📦 Using Railway MySQL environment variables");
    return {
      host: process.env.MYSQLHOST || "centerbeam.proxy.rlwy.net",
      port: parseInt(process.env.MYSQLPORT || "19932"),
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE || "railway",
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
      acquireTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
    };
  }

  // Ưu tiên 3: Biến DB_* custom
  console.log("📦 Using custom DB_* environment variables");
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pc_store",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: "utf8mb4",
  };
};

const dbConfig = getDbConfig();

// Tạo connection pool
const pool = process.env.DATABASE_URL
  ? mysql.createPool({ uri: process.env.DATABASE_URL, ...dbConfig })
  : mysql.createPool(dbConfig);

// Test connection với logging chi tiết
export const testConnection = async (): Promise<boolean> => {
  let connection;
  try {
    console.log("🔍 Testing database connection...");
    console.log("Config:", {
      host: dbConfig.host || "DATABASE_URL",
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
    });

    connection = await pool.getConnection();

    // Test query đơn giản
    const [result] = await connection.query("SELECT 1 + 1 AS test_result");
    console.log(
      "✅ Database connected successfully! Test query result:",
      result
    );

    // Kiểm tra database name
    const [dbName] = await connection.query("SELECT DATABASE() as db_name");
    console.log("📊 Connected to database:", dbName);

    connection.release();
    return true;
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Config used:", {
      host: dbConfig.host || "DATABASE_URL",
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      hasPassword: !!dbConfig.password,
    });

    if (connection) connection.release();
    return false;
  }
};

// Hàm thực thi query
export const executeQuery = async (
  sql: string,
  params: any[] = []
): Promise<any> => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error: any) {
    console.error("❌ Query error:", error.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Hàm lấy connection từ pool
export const getConnection = async () => {
  return await pool.getConnection();
};

// Hàm kiểm tra và tạo database nếu chưa tồn tại
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Kiểm tra kết nối
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Cannot connect to database");
    }

    console.log("🗄️  Checking database structure...");

    // Kiểm tra các bảng cơ bản
    const [tables] = await executeQuery(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `,
      [dbConfig.database]
    );

    console.log(
      `📊 Found ${
        Array.isArray(tables) ? tables.length : 0
      } tables in database ${dbConfig.database}`
    );

    // Nếu không có bảng, chạy migration
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log("🔄 No tables found. Running migrations...");
      await runMigrations();
    }
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
};

// Hàm chạy migrations
const runMigrations = async (): Promise<void> => {
  try {
    console.log("🚀 Running migrations...");

    // Đọc file schema từ railway-schema.sql
    const fs = await import("fs");
    const path = await import("path");

    const schemaPath = path.join(__dirname, "../database/railway-schema.sql");

    if (!fs.existsSync(schemaPath)) {
      console.log("📄 Creating basic schema...");
      // Tạo các bảng cơ bản nếu không có file schema
      await createBasicSchema();
    } else {
      const schema = fs.readFileSync(schemaPath, "utf8");
      // Chạy từng câu lệnh SQL
      const statements = schema
        .split(";")
        .filter((stmt) => stmt.trim().length > 0);

      for (const statement of statements) {
        try {
          await executeQuery(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Bỏ qua lỗi "table already exists"
          if (error.message.includes("already exists")) {
            console.log(`⚠️  Table already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log("✅ Migrations completed successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
};

// Tạo schema cơ bản nếu không có file
const createBasicSchema = async (): Promise<void> => {
  const basicSchema = `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      image VARCHAR(255),
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category_id VARCHAR(36),
      images JSON,
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      title VARCHAR(255) NOT NULL,
      image VARCHAR(255) NOT NULL,
      link VARCHAR(255),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const statements = basicSchema
    .split(";")
    .filter((stmt) => stmt.trim().length > 0);
  for (const statement of statements) {
    await executeQuery(statement);
  }
};

export default pool;

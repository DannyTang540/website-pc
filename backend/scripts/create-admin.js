// Simple script to create or promote an admin user.
// Usage: from backend folder run `node scripts/create-admin.js` or set env vars before running.

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const getPoolConfig = () => {
  // Railway: DATABASE_URL
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 30000,
      acquireTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    };
  }

  // Railway: MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE
  if (process.env.MYSQLHOST) {
    return {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "",
      database: process.env.MYSQLDATABASE || "railway",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 30000,
      acquireTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    };
  }

  // Local/custom: DB_*
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pc_store",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 30000,
    acquireTimeout: 30000,
  };
};

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  console.log(`Using admin email=${email}`);

  const poolConfig = getPoolConfig();
  const conn = await mysql.createPool(poolConfig);

  try {
    // Check if user exists
    const [rows] = await conn.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if ((rows || []).length > 0) {
      const id = rows[0].id;
      // Update role and password
      const hashed = await bcrypt.hash(password, 10);
      await conn.execute(
        "UPDATE users SET role = ?, password = ?, updated_at = NOW() WHERE id = ?",
        ["admin", hashed, id]
      );
      console.log(
        `Promoted existing user ${email} to admin and updated password.`
      );
    } else {
      const id = uuidv4();
      const hashed = await bcrypt.hash(password, 10);
      await conn.execute(
        `INSERT INTO users (id, first_name, last_name, email, password, phone, avatar, role, points, membership, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, "Admin", "User", email, hashed, "", null, "admin", 0, "none"]
      );
      console.log(`Created new admin user ${email} with password ${password}`);
    }
  } catch (err) {
    console.error("Error creating/promoting admin:", err.message || err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

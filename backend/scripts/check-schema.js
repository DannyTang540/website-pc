// Run with: node scripts/check-schema.js
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pc_store",
  });

  try {
    console.log("Checking database schema...");

    // Check products table structure
    const [rows] = await connection.query(
      `
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
    `,
      [process.env.DB_NAME || "pc_store"]
    );

    console.log("\nProducts table columns:");
    console.table(rows);

    // Check if tags column exists
    const hasTagsColumn = rows.some((col: any) => col.COLUMN_NAME === "tags");
    console.log("\nTags column exists:", hasTagsColumn);

    if (!hasTagsColumn) {
      console.log("\nGenerating SQL to add tags column:");
      console.log(`
ALTER TABLE products 
ADD COLUMN tags JSON DEFAULT (JSON_ARRAY()) COMMENT 'Array of tag strings' 
AFTER slug;`);
    }
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    await connection.end();
  }
}

checkSchema();

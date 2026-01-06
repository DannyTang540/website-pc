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

    const schemaName = process.env.DB_NAME || "pc_store";

    const printTableColumns = async (tableName) => {
      const [rows] = await connection.query(
        `
        SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `,
        [schemaName, tableName]
      );
      console.log(`\n${tableName} table columns:`);
      console.table(rows);
      return rows;
    };

    // Check products table structure
    const productsCols = await printTableColumns("products");

    // Check if tags column exists
    const hasTagsColumn = productsCols.some(
      (col) => col.COLUMN_NAME === "tags"
    );
    console.log("\nTags column exists:", hasTagsColumn);

    if (!hasTagsColumn) {
      console.log("\nGenerating SQL to add tags column:");
      console.log(`
ALTER TABLE products 
ADD COLUMN tags JSON DEFAULT (JSON_ARRAY()) COMMENT 'Array of tag strings' 
AFTER slug;`);
    }

    // Check orders + order_items tables
    await printTableColumns("orders");
    await printTableColumns("order_items");
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    await connection.end();
  }
}

checkSchema();

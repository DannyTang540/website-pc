// Run with: node scripts/run-tags-migration.js
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pc_store",
    multipleStatements: true,
  });

  try {
    console.log("Connecting to database...");
    await connection.connect();
    console.log("Connected to database");

    // Check if tags column exists
    const [check] = await connection.query(
      `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tags'
    `,
      [process.env.DB_NAME || "pc_store"]
    );

    if (check[0].count > 0) {
      console.log("Tags column already exists");
      return;
    }

    console.log("Adding tags column to products table...");

    // Add the tags column
    await connection.query(`
      ALTER TABLE products 
      ADD COLUMN tags JSON DEFAULT (JSON_ARRAY()) COMMENT 'Array of tag strings' 
      AFTER slug;
    `);

    console.log("Tags column added successfully!");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log("Database connection closed");
  }
}

runMigration();

// Run with: node scripts/run-migration.js
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  // Database connection configuration
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "your_database_name",
    multipleStatements: true,
  });

  try {
    console.log("Connecting to database...");
    await connection.connect();
    console.log("Connected to database");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "src",
      "database",
      "migrations",
      "002_add_slug_to_products.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Running migration...");
    await connection.query(sql);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log("Database connection closed");
  }
}

runMigration();

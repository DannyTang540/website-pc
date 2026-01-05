import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

async function runMigration() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log("📝 Running schema migration...");

    const schemaPath = path.join(__dirname, "../src/database/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    // Split by ; to execute each statement
    const statements = schemaSql.split(";").filter((stmt) => stmt.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log(`Executing: ${stmt.substring(0, 60)}...`);
        try {
          // Use query() instead of execute() to allow USE, CREATE DATABASE, etc.
          await (connection as any).query(stmt);
        } catch (error: any) {
          // Ignore table exists errors
          if (
            error.code !== "ER_TABLE_EXISTS_ERROR" &&
            error.code !== "ER_DB_CREATE_EXISTS"
          ) {
            throw error;
          }
        }
      }
    }

    console.log("✅ Schema migration completed!");

    console.log("📝 Running seeds...");
    const seedsPath = path.join(__dirname, "../src/database/seeds.sql");
    const seedsSql = fs.readFileSync(seedsPath, "utf-8");

    const seedStatements = seedsSql.split(";").filter((stmt) => stmt.trim());
    for (const stmt of seedStatements) {
      if (stmt.trim()) {
        console.log(`Executing: ${stmt.substring(0, 60)}...`);
        try {
          await (connection as any).query(stmt);
        } catch (error: any) {
          // Ignore duplicate entry errors when re-running seeds
          if (error.code !== "ER_DUP_ENTRY") {
            throw error;
          } else {
            console.log("  (Skipped: duplicate entry)");
          }
        }
      }
    }

    console.log("✅ Seeds completed!");
    console.log("🎉 Database setup finished successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

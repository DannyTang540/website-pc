"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
};
async function runMigration() {
    const connection = await promise_1.default.createConnection(dbConfig);
    try {
        console.log("📝 Running schema migration...");
        const schemaPath = path_1.default.join(__dirname, "../src/database/schema.sql");
        const schemaSql = fs_1.default.readFileSync(schemaPath, "utf-8");
        // Split by ; to execute each statement
        const statements = schemaSql.split(";").filter((stmt) => stmt.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                console.log(`Executing: ${stmt.substring(0, 60)}...`);
                try {
                    // Use query() instead of execute() to allow USE, CREATE DATABASE, etc.
                    await connection.query(stmt);
                }
                catch (error) {
                    // Ignore table exists errors
                    if (error.code !== "ER_TABLE_EXISTS_ERROR" &&
                        error.code !== "ER_DB_CREATE_EXISTS") {
                        throw error;
                    }
                }
            }
        }
        console.log("✅ Schema migration completed!");
        console.log("📝 Running seeds...");
        const seedsPath = path_1.default.join(__dirname, "../src/database/seeds.sql");
        const seedsSql = fs_1.default.readFileSync(seedsPath, "utf-8");
        const seedStatements = seedsSql.split(";").filter((stmt) => stmt.trim());
        for (const stmt of seedStatements) {
            if (stmt.trim()) {
                console.log(`Executing: ${stmt.substring(0, 60)}...`);
                try {
                    await connection.query(stmt);
                }
                catch (error) {
                    // Ignore duplicate entry errors when re-running seeds
                    if (error.code !== "ER_DUP_ENTRY") {
                        throw error;
                    }
                    else {
                        console.log("  (Skipped: duplicate entry)");
                    }
                }
            }
        }
        console.log("✅ Seeds completed!");
        console.log("🎉 Database setup finished successfully!");
    }
    catch (error) {
        console.error("❌ Migration error:", error);
        throw error;
    }
    finally {
        await connection.end();
    }
}
runMigration().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});

// backend/src/database/migrate.ts
import fs from "fs";
import path from "path";
import pool from "./database";

const runMigrations = async () => {
  console.log("🚀 Bắt đầu chạy migrations...");

  const connection = await pool.getConnection();

  try {
    // Đọc file migration
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "001_add_cart_tables.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Đang chạy migration...");

    // Chia thành các câu lệnh SQL riêng biệt bằng dấu ';'
    // Nhưng phải tránh chia nhầm trong các trigger
    const statements: string[] = [];
    let currentStatement = "";
    let inTrigger = false;
    let delimiter = ";";

    const lines = sql.split("\n");

    for (let line of lines) {
      // Kiểm tra nếu bắt đầu trigger
      if (line.trim().toUpperCase().startsWith("DELIMITER")) {
        delimiter = line.trim().split(" ")[1];
        continue;
      }

      // Kiểm tra nếu đang trong trigger
      if (line.trim().toUpperCase().includes("BEGIN")) {
        inTrigger = true;
      }

      // Thêm dòng vào câu lệnh hiện tại
      currentStatement += line + "\n";

      // Kiểm tra nếu kết thúc trigger
      if (line.trim().toUpperCase().includes("END")) {
        const nextLine = lines[lines.indexOf(line) + 1] || "";
        if (nextLine.trim().startsWith(delimiter)) {
          inTrigger = false;
        }
      }

      // Nếu không trong trigger và gặp dấu ';', thì tách câu lệnh
      if (!inTrigger && line.trim().endsWith(";")) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }

      // Nếu gặp DELIMITER để trở lại
      if (line.trim().toUpperCase() === "DELIMITER ;") {
        delimiter = ";";
      }
    }

    // Thêm câu lệnh cuối cùng nếu còn
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Chạy từng câu lệnh
    for (const statement of statements) {
      if (statement.trim() === "") continue;

      try {
        console.log(`📝 Đang chạy: ${statement.substring(0, 100)}...`);
        await connection.query(statement);
      } catch (error: any) {
        // Bỏ qua lỗi "already exists" cho trigger
        if (error.message.includes("already exists")) {
          console.log(`⚠️  Đã tồn tại: ${error.message.split("'")[1]}`);
          continue;
        }
        throw error;
      }
    }

    console.log("✅ Migration đã chạy thành công!");

    // Kiểm tra các bảng đã được tạo
    const [tables]: any = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'pc_store'
      ORDER BY table_name
    `);

    console.log("\n📊 Danh sách bảng trong database:");
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi chạy migration:", error.message);
    console.error("SQL Error Code:", error.code);
    console.error("SQL State:", error.sqlState);

    // Hiển thị thêm thông tin nếu có
    if (error.sqlMessage) {
      console.error("SQL Message:", error.sqlMessage);
    }

    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
    console.log("\n🔌 Đã đóng kết nối database");
  }
};

// Chạy migrations
runMigrations();

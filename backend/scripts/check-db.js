const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pc_store",
  });

  try {
    console.log("✅ Connected to MySQL server");

    // Check if database exists
    const [dbs] = await connection.execute("SHOW DATABASES");
    const dbExists = dbs.some(
      (db) => db.Database === (process.env.DB_NAME || "pc_store")
    );
    console.log(
      `Database '${process.env.DB_NAME || "pc_store"}' exists:`,
      dbExists
    );

    if (dbExists) {
      // Check if products table exists
      await connection.query("USE pc_store");
      const [tables] = await connection.execute("SHOW TABLES LIKE 'products'");
      console.log("Products table exists:", tables.length > 0);

      if (tables.length > 0) {
        const [columns] = await connection.execute("DESCRIBE products");
        console.log("Products table columns:");
        console.table(columns);

        // Check if there's any data
        const [products] = await connection.execute(
          "SELECT COUNT(*) as count FROM products"
        );
        console.log(`Number of products: ${products[0].count}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await connection.end();
  }
}

checkDatabase();

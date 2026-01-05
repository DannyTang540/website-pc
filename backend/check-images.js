const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkImages() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("=== Checking featured products ===");
  const [rows] = await conn.query(
    "SELECT id, name, featured, images FROM products WHERE featured = 1 LIMIT 3"
  );

  if (rows.length === 0) {
    console.log("No featured products found!");

    // Check all products
    console.log("\n=== All products with featured flag ===");
    const [allRows] = await conn.query(
      "SELECT id, name, featured, images FROM products LIMIT 5"
    );
    allRows.forEach((r) => {
      console.log("ID:", r.id);
      console.log("Name:", r.name);
      console.log("Featured:", r.featured);
      console.log("Images type:", typeof r.images);
      console.log("Is Array:", Array.isArray(r.images));
      console.log("Images value:", JSON.stringify(r.images));
      console.log("---");
    });
  } else {
    rows.forEach((r) => {
      console.log("ID:", r.id);
      console.log("Name:", r.name);
      console.log("Featured:", r.featured);
      console.log("Images type:", typeof r.images);
      console.log("Is Array:", Array.isArray(r.images));
      console.log("Images value:", JSON.stringify(r.images));
      console.log("---");
    });
  }

  await conn.end();
}

checkImages().catch(console.error);

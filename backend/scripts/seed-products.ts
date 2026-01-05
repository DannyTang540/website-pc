import { v4 as uuidv4 } from "uuid";
import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a connection pool
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecommerce",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

interface Product {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  brand: string;
  images: string[];
  specifications: Record<string, any>;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  tags?: string[];
}

const sampleProducts: Product[] = [
  {
    name: "MacBook Pro 16-inch",
    description: "16-inch MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD",
    price: 24990000,
    originalPrice: 26990000,
    categoryId: "laptop",
    brand: "Apple",
    images: [
      "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/mbp16-spacegray-select-202301?wid=1808&hei=1686&fmt=jpeg&qlt=90&.v=1671304673200",
    ],
    specifications: {
      screen: "16.2-inch Liquid Retina XDR display",
      processor: "M2 Pro chip",
      memory: "16GB unified memory",
      storage: "512GB SSD",
      battery: "Up to 21 hours",
    },
    inStock: true,
    stockQuantity: 50,
    featured: true,
    tags: ["laptop", "apple", "macbook", "m2"],
  },
  {
    name: "Dell XPS 15",
    description:
      "15.6-inch 4K UHD+ Touch Laptop, Intel Core i7, 16GB RAM, 1TB SSD",
    price: 42990000,
    originalPrice: 44990000,
    categoryId: "laptop",
    brand: "Dell",
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9520/media-gallery/black/notebook-xps-9520-t-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&wid=4000&hei=4000&qlt=100,1&resMode=sharp2&size=4000,4000&chrss=full",
    ],
    specifications: {
      screen: "15.6-inch 4K UHD+ (3840 x 2400) Touch Display",
      processor: "12th Gen Intel Core i7-12700H",
      memory: "16GB DDR5",
      storage: "1TB M.2 PCIe NVMe SSD",
      graphics: "NVIDIA GeForce RTX 3050 Ti",
    },
    inStock: true,
    stockQuantity: 30,
    featured: true,
    tags: ["laptop", "dell", "xps", "intel"],
  },
  {
    name: "iPhone 14 Pro Max",
    description: "6.7-inch Super Retina XDR display, A16 Bionic chip, 128GB",
    price: 30990000,
    originalPrice: 32990000,
    categoryId: "smartphone",
    brand: "Apple",
    images: [
      "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-deeppurple?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1663703841896",
    ],
    specifications: {
      screen: "6.7-inch Super Retina XDR display",
      processor: "A16 Bionic chip",
      storage: "128GB",
      camera: "Pro camera system: 48MP Main | Ultra Wide | Telephoto",
      battery: "Up to 29 hours video playback",
    },
    inStock: true,
    stockQuantity: 100,
    featured: true,
    tags: ["smartphone", "apple", "iphone", "5g"],
  },
  {
    name: "Samsung Galaxy S23 Ultra",
    description:
      "6.8-inch Dynamic AMOLED 2X, Snapdragon 8 Gen 2, 256GB, 12GB RAM",
    price: 28990000,
    originalPrice: 30990000,
    categoryId: "smartphone",
    brand: "Samsung",
    images: [
      "https://images.samsung.com/vn/smartphones/galaxy-s23-ultra/images/galaxy-s23-ultra-highlights-kv.jpg",
    ],
    specifications: {
      screen: "6.8-inch Dynamic AMOLED 2X, 120Hz",
      processor: "Snapdragon 8 Gen 2",
      memory: "12GB RAM",
      storage: "256GB",
      camera: "200MP Wide + 12MP Ultra Wide + 10MP Telephoto x2",
    },
    inStock: true,
    stockQuantity: 80,
    featured: true,
    tags: ["smartphone", "samsung", "galaxy", "android"],
  },
  {
    name: "Sony WH-1000XM5",
    description: "Wireless Noise Cancelling Headphones, 30-hour battery life",
    price: 7990000,
    originalPrice: 8990000,
    categoryId: "headphones",
    brand: "Sony",
    images: [
      "https://www.sony.com.vn/image/7b2b1f5c6b0e5c5f8e8e8e8e8e8e8e8e?fmt=pjpeg&wid=1014&hei=396&bgcolor=F1F5F9&bgc=F1F5F9",
    ],
    specifications: {
      type: "Over-ear",
      battery: "Up to 30 hours",
      noiseCancelling: "Yes, industry-leading",
      wireless: "Bluetooth 5.2",
      weight: "250g",
    },
    inStock: true,
    stockQuantity: 45,
    featured: true,
    tags: ["headphones", "wireless", "noise-cancelling", "sony"],
  },
  {
    name: "Apple Watch Series 8",
    description: "GPS + Cellular, 45mm Midnight Aluminum Case",
    price: 15990000,
    originalPrice: 17990000,
    categoryId: "smartwatch",
    brand: "Apple",
    images: [
      "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/midnight-aluminum-45mm-s8-cell-8s_VW_34FR+watch-49-ultra-whitetitanium-cell-8s_VW_34FR_WF_CO?wid=2000&hei=2000&fmt=png-alpha&.v=1660689362864",
    ],
    specifications: {
      display: "Always-On Retina display",
      connectivity: "GPS + Cellular",
      battery: "Up to 18 hours",
      waterResistant: "50m",
      healthFeatures: "ECG, Blood Oxygen, Temperature Sensing",
    },
    inStock: true,
    stockQuantity: 60,
    featured: true,
    tags: ["smartwatch", "apple", "wearable", "fitness"],
  },
];

async function seedProducts() {
  let connection: PoolConnection | null = null;

  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log("Creating categories...");
    // Create categories if they don't exist
    await connection.query(`
      INSERT INTO categories (id, name, slug, description)
      VALUES 
        ('laptop', 'Laptop', 'laptop', 'High-performance laptops'),
        ('smartphone', 'Smartphone', 'smartphone', 'Latest smartphones'),
        ('headphones', 'Headphones', 'headphones', 'Wireless and wired headphones'),
        ('smartwatch', 'Smartwatch', 'smartwatch', 'Smart wearable devices')
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        slug = VALUES(slug),
        description = VALUES(description);
    `);

    console.log("Inserting sample products...");
    // Insert sample products
    for (const product of sampleProducts) {
      const slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^\-|\-$)/g, "");

      const id = uuidv4();

      // First, ensure the product has all required fields
      const productData = {
        id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice || null,
        category_id: product.categoryId,
        brand: product.brand,
        images: JSON.stringify(product.images),
        specifications: JSON.stringify(product.specifications),
        in_stock: product.inStock ? 1 : 0,
        stock_quantity: product.stockQuantity,
        featured: product.featured ? 1 : 0,
        slug,
        tags: JSON.stringify(product.tags || []),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Build the query dynamically based on the product data
      const columns = Object.keys(productData).join(", ");
      const values = Object.values(productData);
      const placeholders = values.map(() => "?").join(", ");
      const updates = Object.keys(productData)
        .filter((key) => key !== "id" && key !== "created_at")
        .map((key) => `${key} = VALUES(${key})`)
        .join(", ");

      await connection.query(
        `INSERT INTO products (${columns}) 
         VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );

      console.log(`✅ Added product: ${product.name}`);
    }

    await connection.commit();
    console.log("✅ Successfully seeded all products");
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
    process.exit(0);
  }
}

seedProducts();

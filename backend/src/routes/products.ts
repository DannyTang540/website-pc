// In backend/src/routes/products.ts
import { Router } from "express";
import * as productController from "../controllers/productController";
import { handleMultipleUpload } from "../middleware/upload";

const router = Router();

// Get all products
router.get("/", productController.getProducts);
// Count products
router.get("/count", productController.getProductsCount);
// Search / filter helpers
router.get("/search", productController.searchProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/featured", productController.getFeaturedProducts);
router.get("/brands/list", productController.getBrands);
router.patch("/:id/stock", productController.updateProductStock);

// Create product with upload images
router.post(
  "/",
  handleMultipleUpload("images", 10),
  productController.createProduct
);

// Update product with upload images
router.put(
  "/:id",
  handleMultipleUpload("images", 10),
  productController.updateProduct
);

// Get product by ID
router.get("/:id", productController.getProductById);

// Delete product
router.delete("/:id", productController.deleteProduct);

export default router;

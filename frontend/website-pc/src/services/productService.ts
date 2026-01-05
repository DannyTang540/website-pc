// src/services/productService.ts
import { api } from "./api";
import type { Product, ProductFilter } from "../types/product";

// Helper để extract URL từ image (string hoặc object)
const extractImageUrl = (img: any): string | null => {
  // Null/undefined check
  if (!img) return null;

  // String image
  if (typeof img === "string") {
    const trimmed = img.trim();
    // Skip empty or placeholder
    if (
      !trimmed ||
      trimmed === "[]" ||
      trimmed === "{}" ||
      trimmed.includes("placeholder")
    ) {
      return null;
    }
    return trimmed;
  }

  // Object with url property
  if (typeof img === "object") {
    // Skip empty objects
    if (Object.keys(img).length === 0) return null;

    if (img.url && typeof img.url === "string") {
      const trimmed = img.url.trim();
      if (!trimmed || trimmed.includes("placeholder")) return null;
      return trimmed;
    }
  }

  return null;
};

// Helper để parse images từ nhiều định dạng khác nhau
const parseImages = (imagesData: any): string[] => {
  // Null/undefined
  if (!imagesData) return [];

  // Nếu là string, thử parse JSON
  if (typeof imagesData === "string") {
    const trimmed = imagesData.trim();

    // Empty string or empty array/object string
    if (!trimmed || trimmed === "[]" || trimmed === "{}") return [];

    // Try to parse JSON
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map(extractImageUrl)
            .filter((url): url is string => url !== null);
        }
        // Single object
        const url = extractImageUrl(parsed);
        return url ? [url] : [];
      } catch {
        // Not valid JSON, treat as single URL
        if (!trimmed.includes("placeholder")) {
          return [trimmed];
        }
      }
    } else {
      // Plain URL string
      if (!trimmed.includes("placeholder")) {
        return [trimmed];
      }
    }
    return [];
  }

  // Nếu là array, extract URLs
  if (Array.isArray(imagesData)) {
    return imagesData
      .map(extractImageUrl)
      .filter((url): url is string => url !== null);
  }

  // Single object
  if (typeof imagesData === "object") {
    const url = extractImageUrl(imagesData);
    return url ? [url] : [];
  }

  return [];
};

// Hàm chuẩn hóa sản phẩm
const normalizeProduct = (productData: any): Product => {
  // Xử lý images từ nhiều định dạng khác nhau
  let images: string[] = parseImages(productData.images);

  // Fallback to image field nếu images rỗng
  if (images.length === 0 && productData.image) {
    const imageUrl = extractImageUrl(productData.image);
    if (imageUrl) {
      images = [imageUrl];
    }
  }

  // Chuẩn hóa thông số kỹ thuật
  let specifications: Array<{ key: string; value: string }> = [];
  if (Array.isArray(productData.specifications)) {
    specifications = productData.specifications;
  } else if (
    productData.specifications &&
    typeof productData.specifications === "object"
  ) {
    specifications = Object.entries(productData.specifications).map(
      ([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      })
    );
  }

  // Chuẩn hóa tags
  const tags = Array.isArray(productData.tags) ? productData.tags : [];

  // Xử lý category
  let category = "Không có danh mục";
  if (typeof productData.category === "string") {
    category = productData.category;
  } else if (productData.category && productData.category.name) {
    category = productData.category.name;
  } else if (productData.categoryName) {
    category = productData.categoryName;
  } else if (productData.categoryId) {
    category = productData.categoryId;
  }

  // Trả về đối tượng Product đã chuẩn hóa
  return {
    id: productData.id || "",
    name: productData.name || "",
    description: productData.description || "",
    shortDescription:
      productData.shortDescription || productData.description || "",
    price: Number(productData.price) || 0,
    originalPrice: productData.originalPrice
      ? Number(productData.originalPrice)
      : undefined,
    categoryId: productData.categoryId || "",
    brand: productData.brand || "",
    images: images,
    image: images[0], // Để tương thích với code cũ
    specifications: specifications,
    inStock: Boolean(productData.inStock),
    stockQuantity: productData.stockQuantity || productData.stock || 0,
    featured: Boolean(productData.featured),
    slug: productData.slug || productData.id || "",
    tags: tags,
    status: productData.status || "active",
    rating: productData.rating || 4.5,
    reviewCount: productData.reviewCount || 0,
    category: category,
    createdAt: productData.createdAt || new Date().toISOString(),
    updatedAt: productData.updatedAt || new Date().toISOString(),
  };
};

export const productService = {
  // Lấy tất cả sản phẩm với filter
  getProducts: async (
    filter: ProductFilter = {}
  ): Promise<{ products: Product[]; totalPages: number }> => {
    try {
      const params = new URLSearchParams();

      // Add pagination parameters
      if (filter.page) params.append("page", filter.page.toString());
      if (filter.limit) params.append("limit", filter.limit.toString());

      // Add category filter if provided
      if (filter.category) {
        params.append("category", filter.category.toString());
      }

      // Add status filter
      if (filter.status) {
        params.append("status", filter.status);
      }

      // Add categoryId filter
      if (filter.categoryId) {
        params.append("categoryId", filter.categoryId);
      }

      console.log("Fetching products with params:", params.toString());

      const response = await api.get(`/products?${params}`);
      const body = response.data;

      // Debug log để xem cấu trúc dữ liệu API trả về
      console.log("API Response structure:", {
        body,
        isArray: Array.isArray(body),
        hasData: body?.data,
        dataIsArray: Array.isArray(body?.data),
      });

      let products: Product[] = [];

      // Handle different response formats
      if (Array.isArray(body)) {
        // Nếu response là mảng trực tiếp
        products = body.map(normalizeProduct);
      } else if (body && typeof body === "object") {
        // Handle paginated response
        if (body.data && Array.isArray(body.data)) {
          products = body.data.map(normalizeProduct);
        } else if (body.products && Array.isArray(body.products)) {
          // Handle { products: [...] } format
          products = body.products.map(normalizeProduct);
        } else if (Array.isArray(body.items)) {
          // Handle { items: [...] } format
          products = body.items.map(normalizeProduct);
        } else {
          // Handle single object
          products = [normalizeProduct(body)];
        }
      }

      console.log(`Normalized ${products.length} products`);

      return {
        products,
        totalPages: body.pagination?.pages || body.totalPages || 1,
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], totalPages: 0 };
    }
  },

  // Lấy sản phẩm theo ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${id}`);
      const body: any = response.data;

      // Debug log
      console.log("Product by ID response:", body);

      const productData = body?.data ?? body;
      return normalizeProduct(productData);
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  // Lấy sản phẩm theo slug
  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/slug/${slug}`);

      // Debug log
      console.log("Product by slug response:", response.data);

      // Handle different response formats
      let productData;
      if (response.data && typeof response.data === "object") {
        productData = response.data.data || response.data;
      } else {
        throw new Error("Dữ liệu sản phẩm không hợp lệ");
      }

      return normalizeProduct(productData);
    } catch (error: any) {
      console.error("Error fetching product by slug:", error);
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error("Không tìm thấy sản phẩm");
        }
        throw new Error(
          error.response.data?.message || "Lỗi khi tải thông tin sản phẩm"
        );
      } else if (error.request) {
        throw new Error("Không thể kết nối đến máy chủ");
      } else {
        throw new Error("Đã xảy ra lỗi khi tải thông tin sản phẩm");
      }
    }
  },

  // Lấy sản phẩm nổi bật
  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get("/products/featured");
      const body: any = response.data;

      const productsData = body?.data ?? body;
      const productsArray = Array.isArray(productsData)
        ? productsData
        : [productsData];

      return productsArray.map(normalizeProduct);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await api.get(
        `/products/search?q=${encodeURIComponent(query)}`
      );
      const body: any = response.data;

      const productsData = body?.data ?? body;
      const productsArray = Array.isArray(productsData)
        ? productsData
        : [productsData];

      return productsArray.map(normalizeProduct);
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  },

  // Lấy các brand
  getBrands: async (): Promise<string[]> => {
    try {
      const response = await api.get("/products/brands");
      const body: any = response.data;
      return body?.data ?? body;
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },
};

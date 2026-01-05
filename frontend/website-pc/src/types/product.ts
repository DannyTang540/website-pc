export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export type ProductImageType = string | ProductImage;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId?: string;
  brand: string;
  images: ProductImageType[];
  specifications?: Record<string, any> | any[];
  inStock?: boolean;
  stockQuantity?: number;
  featured?: boolean;
  slug: string;
  tags: string[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  // optional helpers used in UI
  image?: ProductImageType; // primary image
  category?: string; // category name
  // UI-only optional fields kept for compatibility with components
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  stock?: number;
  // legacy UI aliases
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ProductFilter {
  // Category and subcategory filters
  category?: string | string[];
  categoryId?: string;
  subcategory?: string | string[];

  // Product attributes
  brand?: string | string[];
  priceRange?: [number, number];
  specifications?: Record<string, string[]>;
  inStock?: boolean;
  featured?: boolean;
  status?: "active" | "inactive";

  // Search and sorting
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  // Pagination
  page?: number;
  limit?: number;

  // Additional filters
  tags?: string | string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSpecifications?: Record<string, string>;
}

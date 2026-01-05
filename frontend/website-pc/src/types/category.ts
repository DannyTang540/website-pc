// Types for product categories
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  description?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  subcategories?: SubCategory[];
}

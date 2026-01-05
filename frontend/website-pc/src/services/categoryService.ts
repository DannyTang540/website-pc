import { api } from "./api";
import type { Category } from "../types/category";

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  getCategoryById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      throw error;
    }
  },
};

export default categoryService;

import { api } from "./api";
import type { Category } from "../types/category";

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get("/categories");
      const payload: any = response.data;
      const data = Array.isArray(payload) ? payload : payload?.data ?? payload;
      return (data || []) as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  getCategoryById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      const payload: any = response.data;
      const data = payload?.data ?? payload;
      return data as Category;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/slug/${slug}`);
      const payload: any = response.data;
      const data = payload?.data ?? payload;
      return data as Category;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      throw error;
    }
  },
};

export default categoryService;

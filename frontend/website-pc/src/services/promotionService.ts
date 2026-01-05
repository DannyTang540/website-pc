import { api } from "./api";

export interface Promotion {
  id?: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

export const promotionService = {
  getPromotions: async (): Promise<Promotion[]> => {
    const response = await api.get("/promotions");
    return response.data.data;
  },

  getPromotion: async (id: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data.data;
  },

  createPromotion: async (
    data: Omit<Promotion, "id" | "usedCount">
  ): Promise<Promotion> => {
    const response = await api.post("/promotions", data);
    return response.data.data;
  },

  updatePromotion: async (
    id: string,
    data: Partial<Promotion>
  ): Promise<Promotion> => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data.data;
  },

  deletePromotion: async (id: string): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },

  // Add any additional promotion-related API calls here
};

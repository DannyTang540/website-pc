import { api } from "./api";
import {
  type Product,
  type Order,
  type ProductSpecification,
  type Banner,
  type Promotion,
  type SupportMessage,
  type Inventory,
  type RevenueStats,
  type PaginatedResponse,
} from "../types/admin";
import type { Category, SubCategory } from "../types/category";

// Helper function to convert data to FormData
const convertToFormData = (data: any): FormData => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value === undefined || value === null) {
      return;
    }

    // Handle arrays (images, tags, etc.)
    if (Array.isArray(value)) {
      // For images that are files
      if (key === "images" && value.some((item) => item instanceof File)) {
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append("images", file);
          } else if (typeof file === "string") {
            // For existing image URLs
            formData.append("image_urls[]", file);
          }
        });
      } else {
        // For other arrays, convert to JSON string
        formData.append(key, JSON.stringify(value));
      }
    }
    // Handle objects (specifications, etc.)
    else if (typeof value === "object" && value !== null) {
      formData.append(key, JSON.stringify(value));
    }
    // Handle primitive values
    else {
      formData.append(key, value.toString());
    }
  });

  return formData;
};

// Helper function to process product data for API
// Note: Backend expects camelCase keys (name, price, categoryId, etc.)
const processProductData = (data: any) => {
  // Create a deep copy to avoid modifying the original data
  const processedData: any = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Keep camelCase keys as-is since backend expects them
    processedData[key] = value;
  });

  // Handle specifications
  if (!processedData.specifications) {
    processedData.specifications = {};
  } else if (typeof processedData.specifications === "string") {
    try {
      processedData.specifications = JSON.parse(processedData.specifications);
    } catch (e) {
      console.warn("Invalid specifications format, defaulting to empty object");
      processedData.specifications = {};
    }
  }

  // Handle tags
  if (!processedData.tags) {
    processedData.tags = [];
  } else if (typeof processedData.tags === "string") {
    try {
      processedData.tags = JSON.parse(processedData.tags);
    } catch (e) {
      console.warn("Invalid tags format, defaulting to empty array");
      processedData.tags = [];
    }
  }

  // Handle images - make sure it's an array
  if (!processedData.images) {
    processedData.images = [];
  } else if (typeof processedData.images === "string") {
    try {
      processedData.images = JSON.parse(processedData.images);
    } catch (e) {
      console.warn("Invalid images format, defaulting to empty array");
      processedData.images = [];
    }
  }

  return processedData;
};

export const adminService = {
  // ==================== QUẢN LÝ DANH MỤC ====================
  categories: {
    getAll: () => {
      console.log("🔄 GET /categories");
      return api.get<Category[]>("/categories");
    },
    getById: (id: string) => {
      console.log(`🔄 GET /categories/${id}`);
      return api.get<Category>(`/categories/${id}`);
    },
    create: (
      data: Omit<Category, "id" | "createdAt" | "updatedAt" | "subcategories">
    ) => {
      console.log("📤 POST /categories", data);
      return api.post<Category>("/categories", data);
    },
    update: async (id: string, data: any, isFormData = false) => {
      try {
        // Backend expects camelCase keys (name, slug, description, parentId, status)
        const body = data;
        console.log("📤 Sending data to server:", body);

        const response = await api.put(`/categories/${id}`, body, {
          headers: isFormData
            ? { "Content-Type": "multipart/form-data" }
            : { "Content-Type": "application/json" },
        });

        return response;
      } catch (error) {
        console.error("❌ Error in adminService.update:", error);
        throw error;
      }
    },
    delete: (id: string) => {
      console.log(`🗑️ DELETE /categories/${id}`);
      return api.delete(`/categories/${id}`);
    },

    // Quản lý subcategories
    getSubcategories: (parentId: string) =>
      api.get<SubCategory[]>(`/categories/${parentId}/subcategories`),
    createSubcategory: (
      parentId: string,
      data: Omit<SubCategory, "id" | "parentId" | "createdAt" | "updatedAt">
    ) => api.post<SubCategory>(`/categories/${parentId}/subcategories`, data),
    updateSubcategory: (id: string, data: Partial<SubCategory>) =>
      api.put<SubCategory>(`/subcategories/${id}`, data),
    deleteSubcategory: (id: string) => api.delete(`/subcategories/${id}`),
  },

  // ==================== QUẢN LÝ SẢN PHẨM ====================
  products: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      categoryId?: string;
      status?: string;
      search?: string;
    }) => {
      return api.get<PaginatedResponse<Product>>("/products", { params });
    },

    getById: (id: string) => api.get<Product>(`/products/${id}`),

    create: async (data: any) => {
      try {
        console.log("Creating product with data:", data);

        // If caller already provided a FormData (e.g., ProductForm), send it directly
        if (data instanceof FormData) {
          console.log("📤 FormData received directly, sending to API...");
          console.log("FormData entries:");
          for (let [key, value] of data.entries()) {
            if (value instanceof File) {
              console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
            } else {
              console.log(`${key}:`, value);
            }
          }
          const response = await api.post("/products", data);
          return response.data;
        }

        // Process the data to ensure proper JSON formatting
        const processedData = processProductData(data);
        const formData = new FormData();

        // Add all fields to FormData
        Object.entries(processedData).forEach(([key, value]) => {
          if (value === undefined || value === null) return;

          // Handle images
          if (key === "images" && Array.isArray(value)) {
            value.forEach((file: any) => {
              if (file instanceof File) {
                formData.append("images", file);
              } else if (typeof file === "string") {
                formData.append("existingImages", file);
              }
            });
            return;
          }

          // Handle special fields
          if (key === "specifications" || key === "tags") {
            if (Array.isArray(value) || typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            }
            return;
          }

          // Handle other fields
          formData.append(key, String(value));
        });

        // Log form data for debugging
        console.log("FormData entries:");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }

        // Don't set Content-Type manually - let browser set it with boundary
        const response = await api.post("/products", formData);
        return response.data;
      } catch (error: any) {
        console.error("❌ Error creating product:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
        throw error;
      }
    },

    // In frontend/website-pc/src/services/adminService.ts
    update: async (id: string, data: any) => {
      try {
        console.log("📦 Preparing to update product:", { id, data });

        // If caller already provided a FormData (e.g., ProductForm), send it directly
        if (data instanceof FormData) {
          const response = await api.put(`/products/${id}`, data);
          return response.data;
        }

        const formData = new FormData();

        // Add all non-file fields
        Object.entries(data).forEach(([key, value]) => {
          if (key === "images") return; // Handle images separately
          if (value === null || value === undefined) return;

          if (typeof value === "object" && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        // Handle images
        if (Array.isArray(data.images)) {
          const existingUrls: string[] = [];

          data.images.forEach((file: any) => {
            if (file instanceof File) {
              formData.append("images", file);
            } else if (
              typeof file === "string" &&
              (file.startsWith("http") || file.startsWith("/"))
            ) {
              existingUrls.push(file);
            }
          });

          // Send existing URLs as JSON array (not multiple separate fields)
          if (existingUrls.length > 0) {
            formData.append("existingImages", JSON.stringify(existingUrls));
          }
        }

        const response = await api.put(`/products/${id}`, formData);

        return response.data;
      } catch (error) {
        console.error("❌ Error in product update:", error);
        throw error;
      }
    },

    delete: (id: string) => api.delete(`/products/${id}`),

    updateStock: (id: string, stock: number) =>
      api.put<Product>(`/products/${id}/stock`, { stock }),

    updateStatus: (id: string, status: "active" | "inactive") =>
      api.put<Product>(`/products/${id}/status`, { status }),
  },

  // ==================== QUẢN LÝ THÔNG SỐ KỸ THUẬT ====================
  specifications: {
    getByProduct: (productId: string) =>
      api.get<ProductSpecification[]>(`/products/${productId}/specifications`),

    create: (
      productId: string,
      data: Omit<ProductSpecification, "id" | "productId">
    ) =>
      api.post<ProductSpecification>(
        `/products/${productId}/specifications`,
        data
      ),

    update: (id: string, data: Partial<ProductSpecification>) =>
      api.put<ProductSpecification>(`/specifications/${id}`, data),

    delete: (id: string) => api.delete(`/specifications/${id}`),

    bulkUpdate: (
      productId: string,
      specifications: Omit<ProductSpecification, "id" | "productId">[]
    ) =>
      api.put<ProductSpecification[]>(
        `/products/${productId}/specifications/bulk`,
        {
          specifications,
        }
      ),
  },

  // ==================== QUẢN LÝ BANNER ====================
  banners: {
    getAll: () => api.get<Banner[]>("/banners"),

    create: (data: FormData) =>
      api.post<Banner>("/banners", data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    update: (id: string, data: FormData) =>
      api.put<Banner>(`/banners/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    delete: (id: string) => api.delete(`/banners/${id}`),

    updateStatus: (id: string, status: "active" | "inactive") =>
      api.put<Banner>(`/banners/${id}/status`, { status }),
  },

  // ==================== QUẢN LÝ ĐƠN HÀNG ====================
  orders: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    }) => api.get<PaginatedResponse<Order>>("/orders", { params }),

    getById: (id: string) => api.get<Order>(`/orders/${id}`),

    update: (id: string, data: Partial<Order>) =>
      api.put<Order>(`/orders/${id}`, data),

    updateStatus: (id: string, status: Order["status"]) =>
      api.put<Order>(`/orders/${id}/status`, { status }),

    updatePaymentStatus: (id: string, paymentStatus: Order["paymentStatus"]) =>
      api.put<Order>(`/orders/${id}/payment-status`, { paymentStatus }),

    cancelOrder: (id: string, reason: string) =>
      api.put<Order>(`/orders/${id}/cancel`, { reason }),
  },

  // ==================== QUẢN LÝ DOANH THU ====================
  revenue: {
    getStats: (params: {
      period: "day" | "week" | "month" | "year";
      startDate?: string;
      endDate?: string;
    }) => api.get<RevenueStats[]>("/revenue/stats", { params }),

    getOverview: () =>
      api.get<{
        totalRevenue: number;
        totalOrders: number;
        todayRevenue: number;
        todayOrders: number;
        monthlyRevenue: number;
        monthlyOrders: number;
      }>("/revenue/overview"),

    getTopProducts: (params: { limit?: number; period?: string }) =>
      api.get<
        Array<{
          productId: string;
          productName: string;
          totalSold: number;
          revenue: number;
        }>
      >("/revenue/top-products", { params }),
  },

  // ==================== QUẢN LÝ NGƯỜI DÙNG ====================
  users: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      role?: string;
      search?: string;
    }) => {
      const res = await api.get<PaginatedResponse<any> | any>("/users", {
        params,
      });
      const body: any = res.data;
      const data = "data" in body ? body.data : body;
      const total =
        "total" in body ? body.total : Array.isArray(data) ? data.length : 0;
      const page = "page" in body ? body.page : params?.page ?? 1;
      const limit = "limit" in body ? body.limit : params?.limit ?? 10;
      return { data, total, page, limit };
    },

    getById: async (id: string) => {
      const res = await api.get<any>(`/users/${id}`);
      const body: any = res.data;
      return "data" in body ? body.data : body;
    },

    updateRole: (id: string, role: string) =>
      api.put(`/users/${id}/role`, { role }),

    blockUser: (id: string) => api.put(`/users/${id}/block`),

    unblockUser: (id: string) => api.put(`/users/${id}/unblock`),

    delete: (id: string) => api.delete(`/users/${id}`),

    getStatistics: () =>
      api.get<{
        totalUsers: number;
        newUsersThisMonth: number;
        activeUsers: number;
      }>("/users/statistics"),
  },

  // ==================== QUẢN LÝ KHUYẾN MÃI ====================
  promotions: {
    getAll: () =>
      api.get<{ success: boolean; data: Promotion[] }>("/promotions"),

    getById: (id: string) =>
      api.get<{ success: boolean; data: Promotion }>(`/promotions/${id}`),

    create: (
      data: Omit<Promotion, "id" | "createdAt" | "updatedAt" | "usedCount">
    ) => api.post<{ success: boolean; data: Promotion }>("/promotions", data),

    update: (id: string, data: Partial<Promotion>) =>
      api.put<{ success: boolean; data: Promotion }>(`/promotions/${id}`, data),

    delete: (id: string) =>
      api.delete<{ success: boolean; message: string }>(`/promotions/${id}`),

    updateStatus: (id: string, status: "active" | "inactive") =>
      api.put<{ success: boolean; data: Promotion }>(
        `/promotions/${id}/status`,
        { status }
      ),
  },

  // ==================== QUẢN LÝ LINH KIỆN (COMPONENTS) ====================
  components: {
    /**
     * Lấy tất cả components hoặc lọc theo type nếu có
     * @param type Loại component (tùy chọn)
     */
    getAll: async (type?: string) => {
      try {
        const response = await api.get("/components", {
          params: type ? { type } : {},
        });
        return response;
      } catch (error) {
        console.error("Error fetching components:", error);
        throw error;
      }
    },

    create: (data: { type: string; name: string; attributes?: any }) => {
      // Ensure attributes is properly formatted JSON string
      const attributes =
        typeof data.attributes === "string"
          ? data.attributes
          : JSON.stringify(data.attributes || {});

      return api.post("/components", {
        type: data.type,
        name: data.name,
        attributes: attributes,
      });
    },

    update: (id: string, data: any) => {
      // Ensure attributes is properly formatted JSON string
      const attributes =
        typeof data.attributes === "string"
          ? data.attributes
          : JSON.stringify(data.attributes || {});

      return api.put(`/components/${id}`, {
        type: data.type,
        name: data.name,
        attributes: attributes,
      });
    },

    delete: (id: string) => api.delete(`/components/${id}`),

    validate: (components: any[]) =>
      api.post("/components/validate", { components }),
  },

  // ==================== HỖ TRỢ & TIN NHẮN ====================
  support: {
    getMessages: (params?: {
      status?: string;
      page?: number;
      limit?: number;
    }) =>
      api.get<{ success: boolean; data: SupportMessage[] }>("/support", {
        params,
      }),

    getMessage: (id: string) =>
      api.get<{ success: boolean; data: SupportMessage }>(`/support/${id}`),

    replyMessage: (id: string, reply: string) =>
      api.post<{ success: boolean; message: string }>(`/support/${id}/reply`, {
        reply,
      }),

    updateStatus: (id: string, status: SupportMessage["status"]) =>
      api.put<{ success: boolean; data: SupportMessage }>(
        `/support/${id}/status`,
        { status }
      ),

    deleteMessage: (id: string) => api.delete(`/support/${id}`),
  },

  // ==================== QUẢN LÝ KHO HÀNG ====================
  inventory: {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get<{ success: boolean; data: Inventory[] }>("/inventory", {
        params,
      }),

    getLowStock: () =>
      api.get<{ success: boolean; data: Inventory[] }>("/inventory/low-stock"),

    updateStock: (productId: string, currentStock: number) =>
      api.put<{ success: boolean; message: string }>(
        `/inventory/${productId}`,
        { currentStock }
      ),

    updateMinimumStock: (productId: string, minimumStock: number) =>
      api.put<Inventory>(`/inventory/${productId}/minimum-stock`, {
        minimumStock,
      }),

    getAlerts: () =>
      api.get<{
        lowStockCount: number;
        outOfStockCount: number;
        recentAlerts: Inventory[];
      }>("/inventory/alerts"),
  },
};

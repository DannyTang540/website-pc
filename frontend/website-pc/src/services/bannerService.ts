// frontend/website-pc/src/services/bannerService.ts
import { api } from "./api";
import type { Banner, BannerApiResponse } from "../types/banner";

// Helper function to map backend fields to frontend format
export const mapBannerFields = (banner: any): Banner => {
  if (!banner) return banner as Banner;
  const rawImage = banner.image || banner.imageUrl || banner.thumbnailUrl || '';
  let imageUrl = '';
  if (rawImage) {
    if (rawImage.startsWith('http')) {
      imageUrl = rawImage;
    } else if (rawImage.startsWith('uploads/')) {
      imageUrl = `/${rawImage}`;
    } else if (!rawImage.includes('/')) {
      imageUrl = `/uploads/${rawImage}`;
    } else {
      imageUrl = rawImage.startsWith('/') ? rawImage : `/${rawImage}`;
    }
  }
  return {
    ...banner,
    id: banner.id || banner._id,
    image: imageUrl,
    link: banner.link || banner.targetUrl || '',
    targetUrl: banner.targetUrl || banner.link || '',
    order: banner.order || banner.display_order || 0,
    isActive: banner.isActive !== undefined ? banner.isActive : true,
    startDate: banner.startDate || banner.start_date,
    endDate: banner.endDate || banner.end_date,
  };
};

/**
 * Lấy danh sách tất cả banner
 */
// Public (active) banners
export const getBanners = async (): Promise<Banner[]> => {
  try {
    const response = await api.get("/banners");

    // Check if response.data exists and has a data property that is an array
    if (
      !response.data ||
      !response.data.data ||
      !Array.isArray(response.data.data)
    ) {
      console.error("Invalid response format:", response.data);
      return [];
    }

    return response.data.data.map(mapBannerFields);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách banner:", errorMessage);
    return [];
  }
};
// Admin - all banners
export const getBannersAdmin = async (): Promise<Banner[]> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const response = await api.get("/banners/admin/banners", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Check if response.data exists and has a data property that is an array
    if (
      !response.data ||
      !response.data.data ||
      !Array.isArray(response.data.data)
    ) {
      console.error("Invalid response format:", response.data);
      throw new Error("Dữ liệu không hợp lệ từ máy chủ");
    }

    // Map the banners from response.data.data
    return response.data.data.map(mapBannerFields);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Lỗi không xác định";
    const status = (error as any)?.response?.status;
    const responseData = (error as any)?.response?.data;

    console.error("Lỗi khi lấy danh sách banner quản trị:", {
      message: errorMessage,
      status,
      data: responseData,
    });

    if (status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Phiên đăng nhập đã hết hạn");
    } else if (status === 403) {
      // Handle forbidden - show access denied
      throw new Error("Bạn không có quyền truy cập tính năng này");
    }

    throw new Error("Có lỗi xảy ra khi tải dữ liệu banner");
  }
};

/**
 * Lấy thông tin chi tiết banner theo ID
 */
export const getBannerById = async (id: string): Promise<Banner> => {
  try {
    const response = await api.get<BannerApiResponse>(`/banners/${id}`);
    return mapBannerFields(response.data.data);
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin banner ${id}:`, error);
    throw error;
  }
};

export const createBanner = async (formData: FormData): Promise<Banner> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const response = await api.post("/banners/admin/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data) {
      throw new Error("Dữ liệu không hợp lệ từ máy chủ");
    }

    return mapBannerFields(response.data);
  } catch (error) {
    console.error("Lỗi khi tạo mới banner:", error);
    throw error;
  }
};

export const updateBanner = async (
  id: string,
  formData: FormData
): Promise<Banner> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const response = await api.put(`/banners/admin/banners/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data) {
      throw new Error("Dữ liệu không hợp lệ từ máy chủ");
    }

    return mapBannerFields(response.data);
  } catch (error) {
    console.error(`Lỗi khi cập nhật banner ${id}:`, error);
    throw error;
  }
};
/**
 * Xóa banner
 */
export const deleteBanner = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    await api.delete(`/banners/admin/banners/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error(`Lỗi khi xóa banner ${id}:`, error);
    throw error;
  }
};

/**
 * Bật/tắt trạng thái hoạt động của banner
 * @param id ID của banner cần cập nhật
 * @param isActive Trạng thái mới (true: bật, false: tắt)
 */
export const toggleBannerStatus = async (
  id: string,
  isActive: boolean
): Promise<Banner> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const response = await api.patch<BannerApiResponse>(
      `/banners/admin/banners/${id}/status`,
      { isActive },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data) {
      throw new Error("Dữ liệu không hợp lệ từ máy chủ");
    }

    return mapBannerFields(response.data);
  } catch (error) {
    console.error(`Lỗi khi cập nhật trạng thái banner ${id}:`, error);
    throw error;
  }
};

/**
 * Tải lên hình ảnh banner
 */
export const uploadBannerImage = async (
  file: File
): Promise<{ url: string }> => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post<{ data: { url: string } }>(
      "/banners/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi tải lên hình ảnh:", error);
    throw error;
  }
};

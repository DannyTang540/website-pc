import { api } from "../config/api";
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  UpdateProfileData,
  ChangePasswordData,
  Address,
} from "../types/auth";

// All mock data and mock mode have been removed. Using actual API calls only.

export const authService = {
  // Dang nhap - DA CAP NHAT de ho tro admin
  login: async (loginData: LoginData): Promise<AuthResponse> => {
    console.log("Login service called with:");
    try {
      const response = await api.post("/auth/login", loginData);
      console.log("Login response:", response.data); // Thêm log để debug
      const { user, token, refreshToken } = response.data;

      if (!user || !token) {
        throw new Error("Phản hồi từ máy chủ không hợp lệ");
      }

      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      return { user, token, refreshToken };
    } catch (error: any) {
      console.error("Login error details:", {
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  },

  // Dang ky
  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/register", registerData);
      const { user, token, refreshToken } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);

      return { user, token, refreshToken };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Dang ky that bai");
    }
  },

  // Lay thong tin nguoi dung hien tai
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Cap nhat ho so
  updateProfile: async (updateData: UpdateProfileData): Promise<User> => {
    try {
      const response = await api.put("/auth/profile", updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Cap nhat ho so that bai"
      );
    }
  },

  // Doi mat khau
  changePassword: async (
    changePasswordData: ChangePasswordData
  ): Promise<void> => {
    try {
      await api.put("/auth/change-password", changePasswordData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Doi mat khau that bai");
    }
  },

  // Quen mat khau
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Yeu cau that bai");
    }
  },

  // Dat lai mat khau
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.post("/auth/reset-password", { token, newPassword });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Dat lai mat khau that bai"
      );
    }
  },

  // Dang xuat
  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  },

  // Upload avatar
  uploadAvatar: async (formData: FormData): Promise<User> => {
    try {
      const response = await api.patch("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Upload avatar that bai"
      );
    }
  },

  // Lam moi token
  refreshToken: async (): Promise<string> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.log("No refresh token found");
        throw new Error(
          "Không tìm thấy refresh token. Vui lòng đăng nhập lại."
        );
      }

      console.log("Refreshing token...");
      const response = await api.post(
        "/auth/refresh", // Updated endpoint to match backend
        { refreshToken },
        {
          // Skip auth refresh to prevent infinite loops
          skipAuthRefresh: true,
          headers: {
            Authorization: "", // Clear any existing auth header
          } as any, // Type assertion to bypass type checking
        }
      );

      if (!response.data || !response.data.token) {
        console.error("Invalid token refresh response:", response.data);
        throw new Error("Phản hồi từ máy chủ không hợp lệ");
      }

      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      if (!newToken) {
        throw new Error("Không nhận được token mới từ máy chủ");
      }

      localStorage.setItem("token", newToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      console.log("Token refreshed successfully");
      return newToken;
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      // Clear tokens on error to force re-login
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      // Redirect to login if we're not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?session_expired=1";
      }

      const errorMessage =
        error.response?.data?.message ||
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      throw new Error(errorMessage);
    }
  },

  // Kiem tra xem nguoi dung co phai admin hay khong
  isAdmin: (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    // Decode the JWT token to check the user role
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role === "admin";
    } catch (e) {
      return false;
    }
  },

  // Lay danh sach nguoi dung (chi admin)
  getUsers: async (page = 1, limit = 10): Promise<any> => {
    try {
      const response = await api.get(
        `/admin/users?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Khong the lay danh sach nguoi dung"
      );
    }
  },

  // Dia chi giao hang
  addressService: {
    // Lay danh sach dia chi
    getAddresses: async (): Promise<Address[]> => {
      const response = await api.get("/user/addresses");
      return response.data || [];
    },

    // Them dia chi moi
    addAddress: async (address: Address): Promise<Address> => {
      const response = await api.post("/user/addresses", address);
      return response.data;
    },

    // Cap nhat dia chi
    updateAddress: async (id: string, address: Address): Promise<Address> => {
      const response = await api.put(`/user/addresses/${id}`, address);
      return response.data;
    },

    // Xoa dia chi
    deleteAddress: async (id: string): Promise<void> => {
      await api.delete(`/user/addresses/${id}`);
    },
  },
};

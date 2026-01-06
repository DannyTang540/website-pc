import axios from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:5000/api";
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

// Extend AxiosRequestConfig to include custom properties
interface CustomRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  headers?: {
    [key: string]: string;
  };
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  // Always target the backend API prefix
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as CustomRequestConfig;

    // If error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(
          `${normalizeApiBaseUrl(
            import.meta.env.VITE_API_URL
          )}/auth/refresh-token`,
          { refreshToken }
        );

        const { token, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("token", token);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Ensure headers object exists then update Authorization
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return api(originalRequest);
      } catch (error) {
        // If refresh token fails, clear auth and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { api };

// src/services/api.ts
import axios, { AxiosError, type AxiosResponse } from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { authService } from "./authService";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Extend AxiosRequestConfig to include our custom options
declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip adding auth header for certain requests
    if (config.skipAuthRefresh) {
      console.log("Skipping auth refresh for:", config.url);
      return config;
    }

    const token = localStorage.getItem("token");
    console.log(
      `[${new Date().toISOString()}] Request to ${config.url} - Token exists:`,
      !!token
    );

    if (token) {
      try {
        // Verify the token is a valid JWT (basic check)
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("Token payload:", {
            userId: payload.id,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString(),
          });
        }
      } catch (e) {
        console.error("Error parsing token:", e);
      }

      config.headers = config.headers || {};

      // For FormData, DELETE the Content-Type header so browser sets it with boundary
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
        console.log("🔧 FormData detected, removed Content-Type header");
      } else if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }

      config.headers.Authorization = `Bearer ${token}`;
      console.log("Authorization header set for request to:", config.url);
    } else {
      console.warn("No token found for authenticated request to:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and authentication errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // If error is not 401, no original request, or we've already retried, reject
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    console.log("Received 401, attempting token refresh...");
    originalRequest._retry = true;

    // If we're already refreshing the token, add the request to the queue
    if (isRefreshing) {
      console.log("Token refresh in progress, adding request to queue");
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => {
          console.error("Error in queued request:", err);
          return Promise.reject(err);
        });
    }

    // Start token refresh
    console.log("Starting token refresh...");
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      // Make refresh token request
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { skipAuthRefresh: true } // Prevent infinite loop
      );
      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      // Update tokens in localStorage
      localStorage.setItem("token", newToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      // Update the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      // Process any queued requests
      processQueue(null, newToken);
      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);

      // Clear tokens and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      // Process any queued requests with error
      processQueue(refreshError, null);

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?session_expired=1";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

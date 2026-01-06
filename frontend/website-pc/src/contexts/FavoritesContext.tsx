// src/contexts/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface FavoriteItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    description?: string;
  };
  addedAt: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (productId: string) => Promise<boolean>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => Promise<boolean>;
  clearFavorites: () => Promise<void>;
  getFavoriteCount: () => number;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  const checkAuth = (): boolean => {
    const token = localStorage.getItem("token");
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    return isAuth;
  };

  // Load favorites from API
  const loadFavorites = async () => {
    const isAuth = checkAuth();
    if (!isAuth) {
      setLoading(false);
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/favorites", {
        skipAuthRefresh: true, // Don't auto-refresh token to prevent redirect loops
        validateStatus: (status) => status < 500, // Don't throw for 401/403
      });

      if (response.status === 200) {
        setFavorites(response.data || []);
      } else if (response.status === 401 || response.status === 403) {
        // Not authenticated or token expired
        setIsAuthenticated(false);
        setFavorites([]);
      } else {
        throw new Error("Failed to load favorites");
      }
    } catch (err: any) {
      console.error("Error loading favorites:", err);
      // Don't show error to user, just log it
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    checkAuth();
    loadFavorites();
  }, []);

  // Add to favorites
  const addToFavorites = async (productId: string) => {
    if (!checkAuth()) {
      throw new Error("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
    }

    try {
      // Optimistically update UI
      setFavorites((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          product: {
            id: productId,
            name: "",
            slug: "",
            price: 0,
            images: [],
          },
          addedAt: new Date().toISOString(),
        },
      ]);

      const response = await api.post(
        "/favorites",
        { productId },
        { skipAuthRefresh: true, validateStatus: () => true }
      );

      if (response.status === 200 || response.status === 201) {
        // Update with actual data from server
        setFavorites((prev) => [
          ...prev.filter((f) => !f.id.startsWith("temp-")),
          response.data,
        ]);
        return true;
      } else if (response.status === 401 || response.status === 403) {
        setIsAuthenticated(false);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        throw new Error("Không thể thêm vào danh sách yêu thích");
      }
    } catch (err: any) {
      console.error("Error adding to favorites:", err);
      // Revert optimistic update
      setFavorites((prev) => prev.filter((f) => !f.id.startsWith("temp-")));

      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsAuthenticated(false);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      throw new Error(
        err.response?.data?.message || "Không thể thêm vào danh sách yêu thích"
      );
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (productId: string) => {
    if (!checkAuth()) {
      throw new Error("Vui lòng đăng nhập để xóa khỏi danh sách yêu thích");
    }

    try {
      await api.delete(`/favorites/${productId}`);
      setFavorites((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
      return Promise.resolve();
    } catch (err: any) {
      console.error("Error removing from favorites:", err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      throw new Error(
        err.response?.data?.message || "Không thể xóa khỏi danh sách yêu thích"
      );
    }
  };

  // Check if product is in favorites
  const isFavorite = async (productId: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    // Check both actual favorites and any pending optimistic updates
    return favorites.some(
      (item) => item.product.id === productId && !item.id.startsWith("temp-")
    );
  };

  // Clear all favorites
  const clearFavorites = async () => {
    if (!checkAuth()) {
      throw new Error("Vui lòng đăng nhập để xóa tất cả sản phẩm yêu thích");
    }

    try {
      await api.delete("/favorites");
      setFavorites([]);
      return Promise.resolve();
    } catch (err: any) {
      console.error("Error clearing favorites:", err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      throw new Error(
        err.response?.data?.message || "Không thể xóa tất cả sản phẩm yêu thích"
      );
    }
  };

  const getFavoriteCount = () => favorites.length;

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        clearFavorites,
        getFavoriteCount,
        loading,
        error,
        isAuthenticated,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

export default FavoritesContext;

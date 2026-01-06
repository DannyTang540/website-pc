import { api } from "./api";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  description?: string;
}

interface CartItemResponse {
  id: string;
  product_id: string;
  name: string;
  price: string;
  quantity: number;
  image: string;
  description?: string;
}

interface CartResponse {
  id: string;
  user_id: string;
  total: string;
  created_at: string;
  updated_at: string;
  items: CartItemResponse[];
}

type CartApiEnvelope =
  | CartResponse
  | {
      success?: boolean;
      message?: string;
      cart?: CartResponse;
      data?: CartResponse;
    };

const extractCart = (payload: CartApiEnvelope | any): CartResponse | null => {
  if (!payload) return null;

  const maybeCart = payload.cart ?? payload.data ?? payload;
  if (!maybeCart) return null;

  // Some backend responses use userId/createdAt casing when cart is empty
  const normalized: any = {
    ...maybeCart,
    user_id: maybeCart.user_id ?? maybeCart.userId,
    created_at: maybeCart.created_at ?? maybeCart.createdAt,
    updated_at: maybeCart.updated_at ?? maybeCart.updatedAt,
    items: Array.isArray(maybeCart.items) ? maybeCart.items : [],
    total:
      typeof maybeCart.total === "number"
        ? String(maybeCart.total)
        : maybeCart.total ?? "0",
  };

  return normalized as CartResponse;
};

export const cartService = {
  getCart: async (): Promise<CartItem[]> => {
    try {
      console.log("Fetching cart...");
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found. User is not logged in.");
        return [];
      }

      const response = await api.get<CartApiEnvelope>("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Cart response:", response.data);

      const cart = extractCart(response.data);

      // Transform the backend response to match frontend's CartItem format
      if (cart?.items) {
        return cart.items.map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image: item.image,
          description: item.description,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return [];
    }
  },

  addToCart: async (
    productId: string,
    quantity: number = 1
  ): Promise<CartItem> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "User is not authenticated. Please log in to add items to cart."
        );
      }
      console.log("Adding to cart with token:", token.substring(0, 10) + "...");

      const response = await api.post<CartApiEnvelope>(
        "/cart/items",
        {
          product_id: productId,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cart = extractCart(response.data);
      if (!cart || !Array.isArray(cart.items)) {
        throw new Error("Invalid response format from server");
      }

      const lastItem = cart.items[cart.items.length - 1];
      if (!lastItem) {
        throw new Error("Cart item not found in server response");
      }
      return {
        id: lastItem.id,
        productId: lastItem.product_id,
        name: lastItem.name,
        price: parseFloat(lastItem.price),
        quantity: lastItem.quantity,
        image: lastItem.image,
        description: lastItem.description,
      };
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (
    itemId: string,
    quantity: number
  ): Promise<CartItem> => {
    try {
      const response = await api.put<CartItemResponse>(
        `/cart/items/${itemId}`,
        {
          quantity,
        }
      );

      return {
        id: response.data.id,
        productId: response.data.product_id,
        name: response.data.name,
        price: parseFloat(response.data.price),
        quantity: response.data.quantity,
        image: response.data.image,
        description: response.data.description,
      };
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  },

  removeFromCart: async (itemId: string): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "User is not authenticated. Please log in to modify cart."
        );
      }

      await api.delete(`/cart/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  clearCart: async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "User is not authenticated. Please log in to modify cart."
        );
      }

      // Backend clears cart via DELETE /cart
      await api.delete("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },
};

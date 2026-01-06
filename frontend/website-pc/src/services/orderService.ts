import { api } from "./api";

const unwrap = <T>(payload: any): T => {
  const maybe = payload?.data ?? payload;
  return maybe as T;
};

export interface Order {
  _id: string;
  orderNumber?: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingAddress: any;
  paymentMethod: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  createOrder: async (orderData: any) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  getOrders: async () => {
    try {
      const response = await api.get("/orders");
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  getOrderById: async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return unwrap(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  cancelOrder: async (id: string) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },

  confirmOrder: async (orderId: string): Promise<Order> => {
    try {
      const response = await api.put(`/orders/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      console.error("Error confirming order:", error);
      throw error;
    }
  },

  verifyPayment: async (sessionId: string): Promise<Order> => {
    try {
      const response = await api.post("/orders/verify-payment", { sessionId });
      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  getOrderHistory: async (): Promise<Order[]> => {
    try {
      const response = await api.get("/orders/history");
      return unwrap(response.data);
    } catch (error) {
      console.error("Error fetching order history:", error);
      throw error;
    }
  },
};

export default orderService;

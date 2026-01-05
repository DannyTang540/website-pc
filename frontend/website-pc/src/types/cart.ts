import type { Product } from "./product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  itemsCount: number;
}

export interface CartCoupon {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  valid: boolean;
  message?: string;
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  coupon?: CartCoupon;
  loading: boolean;
  error: string | null;
}

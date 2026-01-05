import type { Category } from "./category";
import type { Product as BaseProduct } from "./product";
export interface ProductSpecification {
  id?: string;
  name: string;
  value: string;
  productId?: string;
}

export interface Product extends Omit<BaseProduct, 'specifications'> {
  // Map specs to specifications for backward compatibility
  specifications: Record<string, any> | any[];
  // Alias specs to specifications for form compatibility
  specs?: Record<string, any> | any[];
  // Add any admin-specific fields
  category?: any; // Update with proper Category type if available
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderItems: OrderItem[] | undefined;
  id: string;
  userId: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shippingAddress: any;
  paymentMethod: "cod" | "banking" | "momo" | "vnpay";
  paymentStatus: "pending" | "paid" | "failed";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface RevenueStats {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface Promotion {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount: number;
  startDate?: string;
  endDate?: string;
  usageLimit: number;
  usedCount: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportMessage {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  reply?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inventory {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  products(products: any): unknown;
  count: number;
  items(items: any): unknown;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

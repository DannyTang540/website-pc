import { api } from "./api";

interface OrderItem {
  id: string;
  customer: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface OverviewData {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
}

interface RecentOrder {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: OrderItem[];
}

const fetchWithRetry = async <T>(
  request: () => Promise<{ data: T }>,
  retries = 2
): Promise<T> => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchWithRetry(request, retries - 1);
  }
};

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        overviewResponse,
        recentOrdersResponse,
        usersCountResponse,
        productsCountResponse,
      ] = await Promise.allSettled([
        fetchWithRetry<ApiResponse<OverviewData>>(() =>
          api.get("/revenue/overview")
        ),
        fetchWithRetry<ApiResponse<RecentOrder[]>>(() =>
          api.get("/orders/recent?limit=5")
        ),
        fetchWithRetry<ApiResponse<{ count: number }>>(() =>
          api.get("/users/count")
        ),
        fetchWithRetry<ApiResponse<{ count: number }>>(() =>
          api.get("/products/count")
        ),
      ]);

      // Process overview data
      const overview =
        overviewResponse.status === "fulfilled" &&
        overviewResponse.value.success
          ? overviewResponse.value.data
          : null;

      // Process recent orders
      const recentOrders =
        recentOrdersResponse.status === "fulfilled" &&
        recentOrdersResponse.value.success
          ? recentOrdersResponse.value.data
          : [];

      // Process users count
      const usersCount =
        usersCountResponse.status === "fulfilled" &&
        usersCountResponse.value.success
          ? usersCountResponse.value.data.count
          : 0;

      // Process products count
      const productsCount =
        productsCountResponse.status === "fulfilled" &&
        productsCountResponse.value.success
          ? productsCountResponse.value.data.count
          : 0;

      // Fallback: if productsCount is 0 try fetching /products to read pagination total
      let finalProductsCount = productsCount;
      if (!finalProductsCount) {
        try {
          const fallback = await api.get("/products", {
            params: { page: 1, limit: 1 },
          });
          const body = fallback?.data ?? fallback;
          finalProductsCount =
            body?.pagination?.total ??
            body?.total ??
            (Array.isArray(body?.data) ? body.data.length : 0);
        } catch (e) {
          // ignore fallback errors
          console.warn("Fallback to /products for count failed:", e);
        }
      }

      // Log any failed API calls
      const errors = [
        !overview && "Không thể tải dữ liệu tổng quan",
        !recentOrders.length && "Không thể tải đơn hàng gần đây",
        usersCount === 0 && "Không thể tải số lượng người dùng",
        productsCount === 0 && "Không thể tải số lượng sản phẩm",
      ].filter(Boolean);

      if (errors.length > 0) {
        console.warn("Cảnh báo: " + errors.join(", "));
      }

      // Format the response
      return {
        totalOrders: overview?.totalOrders || 0,
        totalRevenue: overview?.totalRevenue || 0,
        totalUsers: usersCount || 0,
        totalProducts: finalProductsCount || 0,
        recentOrders: recentOrders.map((order) => ({
          id: order._id || "",
          customer: order.user?.name || "Khách hàng",
          amount: order.totalPrice || 0,
          status: (["pending", "processing", "completed", "cancelled"].includes(
            order.status?.toLowerCase()
          )
            ? order.status.toLowerCase()
            : "pending") as OrderItem["status"],
          date: order.createdAt
            ? new Date(order.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        })),
      };
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu thống kê:", error);

      // Return empty data with zeros instead of throwing error
      // This allows the UI to still render with empty state
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalProducts: 0,
        recentOrders: [],
      };
    }
  },
};

export default dashboardService;

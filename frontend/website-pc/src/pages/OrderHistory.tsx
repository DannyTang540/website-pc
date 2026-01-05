import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Stack,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  LocalShipping,
  CheckCircle,
  Pending,
  Cancel,
  Schedule,
  Home,
  ShoppingBag,
} from "@mui/icons-material";
import { orderService, type Order } from "../services/orderService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const getStatusVariant = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "delivered":
    case "shipped":
      return "success";
    case "processing":
    case "shipping":
      return "info";
    case "pending":
    case "on-hold":
      return "warning";
    case "cancelled":
    case "refunded":
    case "failed":
      return "error";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "delivered":
    case "shipped":
      return <CheckCircle />;
    case "processing":
    case "on-hold":
      return <Pending />;
    case "shipping":
      return <LocalShipping />;
    case "cancelled":
    case "refunded":
    case "failed":
      return <Cancel />;
    default:
      return <Schedule />;
  }
};

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderHistory();
        setOrders(data);
        setError(null);
      } catch (err: any) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", err);
        setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "HH:mm dd/MM/yyyy", { locale: vi });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Thử lại
        </Button>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <ShoppingBag sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Bạn chưa có đơn hàng nào
        </Typography>
        <Typography color="text.secondary" paragraph>
          Hãy khám phá các sản phẩm của chúng tôi và thực hiện đơn hàng đầu tiên
          của bạn!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Home />}
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Về trang chủ
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Lịch sử đơn hàng
      </Typography>

      <Stack spacing={3}>
        {orders.map((order) => (
          <Paper key={order._id} elevation={2} sx={{ overflow: "hidden" }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "background.paper",
                borderLeft: `4px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box
                display="flex"
                flexDirection={isMobile ? "column" : "row"}
                justifyContent="space-between"
                alignItems={isMobile ? "flex-start" : "center"}
                gap={2}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Mã đơn hàng: {order.orderNumber || order._id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(order.createdAt)}
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(order.status)}
                  label={(() => {
                    const statusLower = order.status.toLowerCase();
                    if (
                      ["completed", "delivered", "shipped"].includes(
                        statusLower
                      )
                    ) {
                      return "Đã giao hàng";
                    }
                    if (
                      statusLower === "processing" ||
                      statusLower === "on-hold"
                    ) {
                      return "Đang xử lý";
                    }
                    if (statusLower === "shipping") {
                      return "Đang giao hàng";
                    }
                    if (
                      ["cancelled", "refunded", "failed"].includes(statusLower)
                    ) {
                      return statusLower === "refunded"
                        ? "Đã hoàn tiền"
                        : "Đã hủy";
                    }
                    return "Chờ xác nhận";
                  })()}
                  color={getStatusVariant(order.status) as any}
                  variant="outlined"
                  sx={{
                    fontWeight: "medium",
                    textTransform: "capitalize",
                    minWidth: 150,
                    justifyContent: "flex-start",
                  }}
                />
              </Box>
            </Box>

            <Divider />

            <Box p={2}>
              {order.items.map((item, index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" gap={2}>
                    <img
                      src={item.image || "/placeholder-product.jpg"}
                      alt={item.name}
                      style={{ width: 80, height: 80, objectFit: "contain" }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Số lượng: {item.quantity}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(item.price)}
                      </Typography>
                    </Box>
                  </Box>
                  {index < order.items.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Box>

            <Divider />

            <Box
              p={2}
              display="flex"
              flexDirection={isMobile ? "column" : "row"}
              justifyContent="space-between"
              alignItems={isMobile ? "stretch" : "center"}
              gap={2}
              bgcolor="background.default"
            >
              <Typography variant="h6">
                Tổng tiền:{" "}
                <span style={{ color: theme.palette.primary.main }}>
                  {formatCurrency(order.total)}
                </span>
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  startIcon={<Visibility />}
                >
                  Xem chi tiết
                </Button>
                {(order.status.toLowerCase() === "pending" ||
                  order.status.toLowerCase() === "on-hold") && (
                  <Button
                    variant="outlined"
                    color="error"
                    size={isMobile ? "small" : "medium"}
                    onClick={async () => {
                      try {
                        await orderService.cancelOrder(order._id);
                        // Refresh orders after cancellation
                        const updatedOrders =
                          await orderService.getOrderHistory();
                        setOrders(updatedOrders);
                      } catch (err) {
                        console.error("Lỗi khi hủy đơn hàng:", err);
                      }
                    }}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
                {(order.status === "delivered" ||
                  order.status === "completed") && (
                  <Button
                    variant="contained"
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    onClick={() => {
                      // TODO: Implement reorder functionality
                      console.log("Reorder:", order);
                    }}
                  >
                    Mua lại
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
};

export default OrderHistory;

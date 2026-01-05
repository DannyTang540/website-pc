import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  Chip,
  Button,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ShoppingCart,
  TrendingUp,
  People,
  AttachMoney,
} from "@mui/icons-material";
import { dashboardService } from "../../services/dashboardService";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (
    status: string
  ): "success" | "warning" | "error" | "info" => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "info";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Hoàn thành";
      case "processing":
        return "Đang xử lý";
      case "pending":
        return "Chờ xử lý";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading && !stats.recentOrders.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
          gap={2}
        >
          <CircularProgress />
          <Typography variant="h6">Đang tải dữ liệu thống kê...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: "bold",
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 4 }}>
          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 18px)",
              },
              minWidth: {
                xs: "100%",
                sm: "calc(50% - 12px)",
                md: "calc(25% - 18px)",
              },
            }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: "white",
                height: "100%",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalOrders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng Đơn Hàng
                    </Typography>
                  </Box>
                  <ShoppingCart sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 18px)",
              },
              minWidth: {
                xs: "100%",
                sm: "calc(50% - 12px)",
                md: "calc(25% - 18px)",
              },
            }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                color: "white",
                height: "100%",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h4" component="div">
                      {formatPrice(stats.totalRevenue)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng Doanh Thu
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 18px)",
              },
              minWidth: {
                xs: "100%",
                sm: "calc(50% - 12px)",
                md: "calc(25% - 18px)",
              },
            }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: "white",
                height: "100%",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng Người Dùng
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 18px)",
              },
              minWidth: {
                xs: "100%",
                sm: "calc(50% - 12px)",
                md: "calc(25% - 18px)",
              },
            }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                color: "white",
                height: "100%",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng Sản Phẩm
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Recent Orders */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
          Đơn Hàng Gần Đây
        </Typography>
        <List>
          {stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order, index) => (
              <React.Fragment key={order.id}>
                <ListItem
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customer} • {order.date}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {formatPrice(order.amount)}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusText(order.status)}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </ListItem>
                {index < stats.recentOrders.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Chưa có đơn hàng nào gần đây
              </Typography>
            </Box>
          )}
        </List>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button variant="outlined" color="primary">
            Xem Tất Cả Đơn Hàng
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;

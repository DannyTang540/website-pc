import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";

interface RevenueOverview {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}
const Revenue: React.FC = () => {
  const [overview, setOverview] = useState<RevenueOverview>({
    totalRevenue: 0,
    totalOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    monthlyOrders: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, topProductsData] = await Promise.all([
        adminService.revenue.getOverview(),
        adminService.revenue.getTopProducts({ limit: 10, period }),
      ]);

      setOverview({
        totalRevenue: Number(overviewData.totalRevenue) || 0,
        totalOrders: Number(overviewData.totalOrders) || 0,
        todayRevenue: Number(overviewData.todayRevenue) || 0,
        todayOrders: Number(overviewData.todayOrders) || 0,
        monthlyRevenue: Number(overviewData.monthlyRevenue) || 0,
        monthlyOrders: Number(overviewData.monthlyOrders) || 0,
      });

      setTopProducts(
        (topProductsData || []).map((p) => ({
          productId: p.productId,
          productName: p.productName,
          totalSold: Number(p.totalSold) || 0,
          revenue: Number(p.revenue) || 0,
        }))
      );
    } catch (error) {
      console.error("Error loading revenue data:", error);
      setError("Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Quản lý doanh thu
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Kỳ báo cáo</InputLabel>
            <Select
              value={period}
              label="Kỳ báo cáo"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="day">Hôm nay</MenuItem>
              <MenuItem value="week">Tuần này</MenuItem>
              <MenuItem value="month">Tháng này</MenuItem>
              <MenuItem value="year">Năm nay</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRevenueData}
            disabled={loading}
          >
            {loading ? <CircularProgress size={18} /> : "Làm mới"}
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
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
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng doanh thu
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#1976D2" }}
                  >
                    {formatCurrency(overview.totalRevenue)}
                  </Typography>
                </Box>
                <AttachMoney
                  sx={{ fontSize: 40, color: "#1976D2", opacity: 0.3 }}
                />
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
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng đơn hàng
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#4CAF50" }}
                  >
                    {overview.totalOrders}
                  </Typography>
                </Box>
                <ShoppingCart
                  sx={{ fontSize: 40, color: "#4CAF50", opacity: 0.3 }}
                />
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
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Doanh thu hôm nay
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#FF9800" }}
                  >
                    {formatCurrency(overview.todayRevenue)}
                  </Typography>
                </Box>
                <TrendingUp
                  sx={{ fontSize: 40, color: "#FF9800", opacity: 0.3 }}
                />
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
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Doanh thu tháng này
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#9C27B0" }}
                  >
                    {formatCurrency(overview.monthlyRevenue)}
                  </Typography>
                </Box>
                <TrendingUp
                  sx={{ fontSize: 40, color: "#9C27B0", opacity: 0.3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Top Products */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Sản phẩm bán chạy
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Tên sản phẩm</TableCell>
                  <TableCell align="right">Số lượng bán</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.map((product, index) => (
                    <TableRow key={product.productId || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{product.productName || "N/A"}</TableCell>
                      <TableCell align="right">
                        {product.totalSold || 0}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(product.revenue || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Revenue;

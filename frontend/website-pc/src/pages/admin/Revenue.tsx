import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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

interface RevenueOverview {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
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
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      // Mock data for revenue
      const mockOverview: RevenueOverview = {
        totalRevenue: 2845000000, // 2.845 tỷ VND
        totalOrders: 156,
        todayRevenue: 285000000, // 285 triệu VND hôm nay
        todayOrders: 8,
        monthlyRevenue: 1245000000, // 1.245 tỷ VND tháng này
        monthlyOrders: 67,
      };

      const mockTopProducts = [
        {
          productId: "prod-001",
          productName: "PC Gaming RTX 4090",
          totalSold: 23,
          revenue: 1377000000, // 1.377 tỷ
        },
        {
          productId: "prod-002",
          productName: "PC Gaming RTX 4080",
          totalSold: 18,
          revenue: 646200000, // 646.2 triệu
        },
        {
          productId: "prod-003",
          productName: "PC Gaming RTX 4070",
          totalSold: 15,
          revenue: 427500000, // 427.5 triệu
        },
        {
          productId: "prod-004",
          productName: "Laptop Gaming Acer Nitro 5",
          totalSold: 12,
          revenue: 226800000, // 226.8 triệu
        },
        {
          productId: "prod-005",
          productName: "PC Gaming Ryzen 7 + RTX 4070",
          totalSold: 10,
          revenue: 325000000, // 325 triệu
        },
        {
          productId: "prod-006",
          productName: "Màn hình Samsung 27inch 144Hz",
          totalSold: 25,
          revenue: 250000000, // 250 triệu
        },
        {
          productId: "prod-007",
          productName: "PC Gaming RTX 4060 Ti",
          totalSold: 8,
          revenue: 196000000, // 196 triệu
        },
        {
          productId: "prod-008",
          productName: "Gaming Chair DXRacer",
          totalSold: 20,
          revenue: 89000000, // 89 triệu
        },
        {
          productId: "prod-009",
          productName: "Bàn Gaming LED RGB",
          totalSold: 14,
          revenue: 112000000, // 112 triệu
        },
        {
          productId: "prod-010",
          productName: "PC Gaming RTX 4060",
          totalSold: 11,
          revenue: 141900000, // 141.9 triệu
        },
      ];

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setOverview(mockOverview);
      setTopProducts(mockTopProducts);
    } catch (error) {
      console.error("Error loading revenue data:", error);
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
            Làm mới
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

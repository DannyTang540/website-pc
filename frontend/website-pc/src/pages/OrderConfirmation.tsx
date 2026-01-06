import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { orderService, type Order } from "../services/orderService";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export default function OrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setError("Không tìm thấy mã đơn hàng");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = (await orderService.getOrderById(id)) as Order;
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.error("Load order failed:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải thông tin đơn hàng"
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={3}>
          <Button variant="contained" onClick={() => navigate("/orders")}>
            Xem lịch sử đơn hàng
          </Button>
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">Không tìm thấy đơn hàng</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom color="primary">
          Đặt hàng thành công!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Đơn hàng của bạn đã được ghi nhận.
        </Typography>

        <Box textAlign="left" mt={4}>
          <Typography variant="subtitle1">
            <strong>Mã đơn hàng:</strong> {order.orderNumber || order._id}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Ngày đặt hàng:</strong>{" "}
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Tổng tiền:</strong> {formatCurrency(order.total)}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Trạng thái:</strong> {order.status}
          </Typography>
        </Box>

        <Box mt={4} display="flex" justifyContent="center" gap={2}>
          <Button variant="contained" onClick={() => navigate("/orders")}>
            Xem lịch sử đơn hàng
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Tiếp tục mua sắm
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

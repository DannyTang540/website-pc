import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { orderService, type Order } from "../services/orderService";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");
    const sessionId = searchParams.get("session_id");

    const confirmOrder = async () => {
      try {
        if (orderId) {
          const orderData = await orderService.confirmOrder(orderId);
          setOrder(orderData);
        } else if (sessionId) {
          const orderData = await orderService.verifyPayment(sessionId);
          setOrder(orderData);
        } else {
          setError("Không tìm thấy thông tin đơn hàng");
        }
      } catch (err: any) {
        console.error("Lỗi xác nhận đơn hàng:", err);
        setError(err.message || "Có lỗi xảy ra khi xác nhận đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    confirmOrder();
  }, [location]);

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
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h5" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
            sx={{ mt: 3 }}
          >
            Quay về trang chủ
          </Button>
        </Paper>
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
        <Typography variant="h6" gutterBottom>
          Cảm ơn bạn đã mua hàng
        </Typography>

        {order && (
          <Box textAlign="left" mt={4}>
            <Typography variant="subtitle1">
              <strong>Mã đơn hàng:</strong> {order.orderNumber || order._id}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Ngày đặt hàng:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Tổng tiền:</strong>{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(order.total)}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Trạng thái:</strong>{" "}
              {order.status === "completed" ? "Đã thanh toán" : "Đang xử lý"}
            </Typography>
          </Box>
        )}

        <Box mt={4} display="flex" justifyContent="center" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/orders")}
          >
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

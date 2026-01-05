import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  TextField,
  Fade,
  useTheme,
  alpha,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Remove, Delete, ShoppingCart } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { cartService } from "../services/cartService";
import type { CartItem as CartItemType } from "../types/cart";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  description?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
  };
}

// Custom hook for cart functionality
const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const items = await cartService.getCart();
      setCartItems(items);
    } catch (err) {
      setError("Không thể tải giỏ hàng. Vui lòng thử lại sau.");
      showSnackbar("Lỗi khi tải giỏ hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await cartService.updateCartItem(itemId, quantity);
      await fetchCartItems(); // Refresh cart
      showSnackbar("Đã cập nhật giỏ hàng", "success");
    } catch (err) {
      showSnackbar("Có lỗi xảy ra khi cập nhật giỏ hàng", "error");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await cartService.removeFromCart(itemId);
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
      showSnackbar("Đã xóa sản phẩm khỏi giỏ hàng", "success");
    } catch (err) {
      showSnackbar("Có lỗi xảy ra khi xóa sản phẩm", "error");
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems([]);
      showSnackbar("Đã xóa toàn bộ giỏ hàng", "success");
    } catch (err) {
      showSnackbar("Có lỗi xảy ra khi xóa giỏ hàng", "error");
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    snackbar,
    handleCloseSnackbar,
  };
};

const Cart: React.FC = () => {
  const theme = useTheme();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    clearCart,
  } = useCart();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const totalPrice = getTotalPrice();

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.02
              )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              textAlign: "center",
            }}
          >
            <ShoppingCart
              sx={{
                fontSize: 80,
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 3,
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Giỏ hàng trống
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: "auto", lineHeight: 1.6 }}
            >
              Hãy khám phá các sản phẩm PC cao cấp và thêm vào giỏ hàng để trải
              nghiệm dịch vụ của chúng tôi
            </Typography>
            <Button
              component={Link}
              to="/products"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: theme.shadows[4],
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[8],
                  transform: "translateY(-2px)",
                },
              }}
            >
              Khám phá sản phẩm
            </Button>
          </Paper>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Giỏ hàng của bạn
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
            >
              {cartItems.length} sản phẩm trong giỏ hàng
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: 4,
            }}
          >
            {/* Cart Items */}
            <Box
              sx={{
                flex: 1,
                maxWidth: { xs: "100%", lg: "calc(66.667% - 16px)" },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {cartItems.map((item, index) => (
                  <Fade in timeout={400 + index * 100} key={item.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: theme.shadows[8],
                          transform: "translateY(-2px)",
                        },
                        background: `linear-gradient(145deg, ${alpha(
                          theme.palette.background.paper,
                          0.9
                        )} 0%, ${alpha(
                          theme.palette.background.paper,
                          0.95
                        )} 100%)`,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 3 }}
                        >
                          {/* Product Image */}
                          <Box
                            sx={{
                              position: "relative",
                              width: 120,
                              height: 120,
                              flexShrink: 0,
                              borderRadius: 2,
                              overflow: "hidden",
                              background: `linear-gradient(135deg, ${alpha(
                                theme.palette.primary.main,
                                0.05
                              )} 0%, ${alpha(
                                theme.palette.primary.main,
                                0.1
                              )} 100%)`,
                            }}
                          >
                            <CardMedia
                              component="img"
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                p: 2,
                              }}
                              image={item.image}
                              alt={item.name}
                            />
                          </Box>

                          {/* Product Info */}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              component={Link}
                              to={`/products/${item.productId}`}
                              sx={{
                                textDecoration: "none",
                                color: "inherit",
                                fontWeight: 600,
                                mb: 1,
                                display: "block",
                                "&:hover": {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                height: 40,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.description || ""}
                            </Typography>
                            <Typography
                              variant="h5"
                              color="primary"
                              sx={{ fontWeight: 700 }}
                            >
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(item.price * item.quantity)}
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                p: 1,
                                borderRadius: 2,
                                background: alpha(
                                  theme.palette.background.default,
                                  0.5
                                ),
                              }}
                            >
                              <IconButton
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                size="small"
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                  },
                                }}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                              <TextField
                                value={item.quantity}
                                size="small"
                                sx={{
                                  width: 60,
                                  "& .MuiInputBase-input": {
                                    textAlign: "center",
                                    padding: "8px 4px",
                                    fontWeight: 600,
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1,
                                  },
                                }}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: "center" },
                                }}
                                onChange={(e) => {
                                  const newQuantity =
                                    parseInt(e.target.value) || 1;
                                  handleQuantityChange(
                                    item.productId,
                                    newQuantity
                                  );
                                }}
                              />
                              <IconButton
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                size="small"
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                  },
                                }}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Box>
                            <IconButton
                              onClick={() => handleRemoveItem(item.id)}
                              sx={{
                                color: theme.palette.error.main,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  transform: "scale(1.1)",
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Box>
            </Box>

            {/* Order Summary */}
            <Box
              sx={{
                width: { xs: "100%", lg: "calc(33.333% - 16px)" },
                flexShrink: 0,
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tóm tắt đơn hàng
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2">Tạm tính:</Typography>
                    <Typography variant="body2">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalPrice)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2">Phí vận chuyển:</Typography>
                    <Typography variant="body2" color="success.main">
                      Miễn phí
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">Tổng cộng:</Typography>
                    <Typography variant="h6" color="primary">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalPrice)}
                    </Typography>
                  </Box>

                  <Button
                    component={Link}
                    to="/checkout"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mb: 1 }}
                  >
                    Tiến hành thanh toán
                  </Button>

                  <Button
                    onClick={clearCart}
                    variant="outlined"
                    fullWidth
                    size="large"
                  >
                    Xóa giỏ hàng
                  </Button>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    🚚 Miễn phí vận chuyển toàn quốc
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    🔧 Bảo hành chính hãng 36 tháng
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💳 Hỗ trợ trả góp 0%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
};

export default Cart;

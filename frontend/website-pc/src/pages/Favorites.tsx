import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Fade,
  useTheme,
  alpha,
  Paper,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as EmptyIcon,
} from "@mui/icons-material";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  slug: string;
  images?: string[];
  image?: string;
}

interface FavoriteItem {
  id: string;
  product: Product;
}

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const { favorites, loading, error, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart } = useCart();
  const theme = useTheme();
  const [localLoading, setLocalLoading] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up messages on unmount
  useEffect(() => {
    return () => {
      setSuccessMessage(null);
      setErrorMessage(null);
    };
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleAddToCart = useCallback(async (product: Product) => {
    try {
      setLocalLoading(product.id);
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0] || product.image || "",
      });
      setSuccessMessage("Đã thêm sản phẩm vào giỏ hàng");
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    } catch (err: unknown) {
      console.error("Error adding to cart:", err);
      setErrorMessage("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    } finally {
      setLocalLoading(null);
    }
  }, [addToCart]);

  const handleRemoveFavorite = useCallback(async (favoriteId: string) => {
    try {
      setLocalLoading(`remove-${favoriteId}`);
      await removeFromFavorites(favoriteId);
      setSuccessMessage("Đã xóa khỏi danh sách yêu thích");
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    } catch (err: unknown) {
      console.error("Error removing from favorites:", err);
      setErrorMessage("Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại.");
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    } finally {
      setLocalLoading(null);
    }
  }, [removeFromFavorites]);

  const handleClearFavorites = useCallback(async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm yêu thích?")) {
      try {
        setClearLoading(true);
        await clearFavorites();
        setSuccessMessage("Đã xóa tất cả sản phẩm yêu thích");
        const timer = setTimeout(() => setSuccessMessage(null), 3000);
        return () => clearTimeout(timer);
      } catch (err: unknown) {
        console.error("Error clearing favorites:", err);
        setErrorMessage("Không thể xóa tất cả sản phẩm yêu thích. Vui lòng thử lại.");
        const timer = setTimeout(() => setErrorMessage(null), 3000);
        return () => clearTimeout(timer);
      } finally {
        setClearLoading(false);
      }
    }
  }, [clearFavorites]);

  if (!user) {
    return <Navigate to="/login" state={{ from: "/favorites" }} replace />;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải danh sách yêu thích...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRetry}
          sx={{ mt: 2 }}
        >
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: "60vh" }}>
        <Box textAlign="center" py={6}>
          <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Bạn chưa có sản phẩm yêu thích nào
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thêm sản phẩm yêu thích để xem tại đây
          </Typography>
          <Button
            component={RouterLink}
            to="/products"
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartIcon />}
            sx={{ mt: 2 }}
          >
            Khám phá sản phẩm
          </Button>
        </Box>
      </Container>
    );
  }

  const totalPrice = favorites.reduce((sum, item) => sum + item.product.price, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>\')',
                opacity: 0.3,
              },
            }}
          >
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <FavoriteIcon sx={{ fontSize: "2.5rem" }} />
                    Sản phẩm yêu thích
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Bạn có {favorites.length} sản phẩm trong danh sách yêu thích
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleClearFavorites}
                  disabled={clearLoading || favorites.length === 0}
                  startIcon={
                    clearLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon />
                    )
                  }
                  sx={{
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "white",
                    minWidth: 150,
                    "&:hover": {
                      borderColor: "white",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                    "&.Mui-disabled": {
                      opacity: 0.5,
                    },
                  }}
                >
                  {clearLoading ? "Đang xử lý..." : "Xóa tất cả"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {favorites.map((item: FavoriteItem) => (
              <Fade in timeout={600} key={item.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      pt: "75%",
                      overflow: "hidden",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={
                        item.product.images?.[0] || "/images/placeholder.png"
                      }
                      alt={item.product.name}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveFavorite(item.id)}
                      size="small"
                      disabled={!!localLoading}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 1)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(255, 255, 255, 0.7)",
                          "& svg": {
                            opacity: 0.5,
                          },
                        },
                      }}
                    >
                      {localLoading === `remove-${item.id}` ? (
                        <CircularProgress size={20} color="error" />
                      ) : (
                        <FavoriteIcon color="error" />
                      )}
                    </IconButton>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component={RouterLink}
                      to={`/products/${item.product.slug}`}
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        textDecoration: "none",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                        mb: 1,
                        minHeight: "3em",
                        "&:hover": {
                          color: "primary.main",
                        },
                      }}
                    >
                      {item.product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                        mb: 2,
                        minHeight: "2.8em",
                      }}
                    >
                      {item.product.description ||
                        "Sản phẩm đang cập nhật mô tả"}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: "auto",
                      }}
                    >
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.product.price)}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddToCart(item.product)}
                        disabled={!!localLoading}
                        startIcon={
                          localLoading === item.product.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ShoppingCartIcon />
                          )
                        }
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 2,
                          py: 0.75,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {localLoading === item.product.id ? "Đang thêm..." : "Thêm vào giỏ"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tổng: {favorites.length} sản phẩm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng giá trị:{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalPrice)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/products"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    py: 1.25,
                    fontWeight: 600,
                  }}
                >
                  Tiếp tục mua sắm
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/cart"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    py: 1.25,
                    fontWeight: 600,
                    boxShadow: theme.shadows[4],
                    "&:hover": {
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  Đến giỏ hàng
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default Favorites;
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Rating,
  Chip,
  Card,
  CardMedia,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  CircularProgress,
  Fade,
  useTheme,
  alpha,
  IconButton,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
  ShoppingCart,
  Favorite,
  Share,
  LocalShipping,
  Security,
  SupportAgent,
  Refresh,
} from "@mui/icons-material";
import type { Product } from "../types/product";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { productService } from "../services/productService";
import { api } from "../services/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAddedAlert, setShowAddedAlert] = useState(false);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, favorites } = useFavorites();
  const theme = useTheme();

  const isFavorite = product
    ? favorites.some((fav) => fav.id === String(product?.id))
    : false;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setError("Không tìm thấy sản phẩm");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Gọi API để lấy thông tin sản phẩm theo slug
        const productData = await productService.getProductBySlug(slug);
        console.log("Normalized product data:", productData);
        if (productData) {
          setProduct(productData);
        } else {
          setError("Không tìm thấy sản phẩm");
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError(error.message || "Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const getProductImage = (product: Product, imageIndex: number = 0) => {
    // Base URL for backend static files
    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/\/api$/, "");

    // Helper to resolve image URL
    const resolveImageUrl = (img: string): string => {
      if (!img) return "/placeholder-image.png";
      if (img.startsWith("http") || img.startsWith("//")) {
        return img;
      }
      // Add base URL for local images (e.g., /uploads/products/xxx.jpg)
      const path = img.startsWith("/") ? img : `/${img}`;
      return `${baseUrl}${path}`;
    };

    // Nếu có mảng images
    if (Array.isArray(product.images) && product.images.length > 0) {
      const targetImage = product.images[imageIndex] || product.images[0];

      // Nếu là string URL
      if (typeof targetImage === "string") {
        return resolveImageUrl(targetImage);
      }

      // Nếu là object có url
      if (targetImage && typeof targetImage === "object" && targetImage.url) {
        return resolveImageUrl(targetImage.url);
      }
    }

    // Fallback đến image field
    if (product.image) {
      if (typeof product.image === "string") {
        return resolveImageUrl(product.image);
      }
    }

    // Default placeholder
    return "/placeholder-image.png";
  };

  const handleBuyNow = async () => {
    if (!product?.id) {
      const message = "Không tìm thấy sản phẩm";
      if (typeof enqueueSnackbar === "function") {
        enqueueSnackbar(message, { variant: "error" });
      } else {
        alert(message);
      }
      return;
    }

    // Check if product is in stock
    if ((product.stockQuantity || 0) < quantity) {
      const message = `Số lượng sản phẩm trong kho không đủ. Chỉ còn ${product.stockQuantity} sản phẩm.`;
      if (typeof enqueueSnackbar === "function") {
        enqueueSnackbar(message, { variant: "error" });
      } else {
        alert(message);
      }
      return;
    }

    setLoading(true);
    try {
      // Create order data
      const orderData = {
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images?.[0] || "",
          },
        ],
        total: product.price * quantity,
        shippingAddress: {}, // Will be filled by user in checkout flow
        paymentMethod: "cod", // Default to cash on delivery
        note: "",
      };

      // Get the auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = "/login";
        return;
      }

      // Make the API request with the auth token
      const response = await api.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response && response.data?._id) {
        // Redirect to order success page
        window.location.href = `/order-success?orderId=${response.data._id}`;

        if (typeof enqueueSnackbar === "function") {
          enqueueSnackbar("Đơn hàng đã được tạo thành công!", {
            variant: "success",
            autoHideDuration: 2000,
          });
        }
      } else {
        throw new Error("Không thể tạo đơn hàng. Vui lòng thử lại sau.");
      }
    } catch (error: any) {
      console.error("Lỗi khi mua hàng:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể thực hiện thanh toán";

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (typeof enqueueSnackbar === "function") {
        enqueueSnackbar(errorMessage, {
          variant: "error",
          autoHideDuration: 5000,
        });
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(String(product.id), quantity);
        setShowAddedAlert(true);
        setTimeout(() => setShowAddedAlert(false), 3000);
      } catch (error) {
        // Error is already handled in the cart context
        console.error("Error adding to cart:", error);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (product) {
      if (isFavorite) {
        removeFromFavorites(String(product.id));
      } else {
        addToFavorites(String(product.id));
      }
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 12,
            flexDirection: "column",
            gap: 3,
          }}
        >
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            Đang tải thông tin sản phẩm...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Không tìm thấy sản phẩm"}
        </Alert>
        <Button variant="contained" onClick={() => window.history.back()}>
          Quay lại
        </Button>
      </Container>
    );
  }
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          (1 - Number(product.price) / Number(product.originalPrice)) * 100
        )
      : 0;

  // Chuẩn bị specifications để hiển thị
  const specificationsToDisplay = Array.isArray(product.specifications)
    ? product.specifications
    : [];

  return (
    <Fade in timeout={600}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Alert for added to cart */}
        {showAddedAlert && (
          <Alert
            severity="success"
            sx={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 1000,
              borderRadius: 2,
            }}
          >
            Đã thêm sản phẩm vào giỏ hàng!
          </Alert>
        )}

        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => window.history.back()}
          >
            Trang chủ
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => window.history.back()}
          >
            {product.category}
          </Link>
          <Typography variant="body2" color="text.primary">
            {product.name}
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
          }}
        >
          {/* Product Images */}
          <Box>
            <Card
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                mb: 2,
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.background.paper,
                  0.9
                )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              }}
            >
              <CardMedia
                component="img"
                image={getProductImage(product, selectedImage)}
                alt={product.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.png";
                }}
                sx={{
                  height: 500,
                  objectFit: "contain",
                  transition: "transform 0.3s ease",
                  backgroundColor: "#f5f5f5",
                }}
              />
            </Card>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  pb: 1,
                }}
              >
                {product.images.map((_, index) => (
                  <Card
                    key={index}
                    sx={{
                      minWidth: 80,
                      height: 80,
                      cursor: "pointer",
                      border:
                        selectedImage === index ? "2px solid" : "1px solid",
                      borderColor:
                        selectedImage === index
                          ? theme.palette.primary.main
                          : alpha(theme.palette.divider, 0.3),
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        transform: "scale(1.05)",
                      },
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <CardMedia
                      component="img"
                      image={getProductImage(product, index)}
                      alt={`${product.name} ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Product Info */}
          <Box>
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.background.paper,
                  0.9
                )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              {/* Product Title */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                {product.name}
              </Typography>

              {/* Rating and Reviews */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={product.rating}
                    precision={0.1}
                    readOnly
                    size="medium"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {product.rating || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({product.reviewCount || 0} đánh giá)
                </Typography>
              </Box>

              {/* Brand and Category */}
              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                {product.brand && (
                  <Chip
                    label={product.brand}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                )}
                {product.category && (
                  <Chip
                    label={product.category}
                    size="small"
                    color="primary"
                    sx={{ borderRadius: 2 }}
                  />
                )}
              </Box>

              {/* Price */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
                >
                  <Typography
                    variant="h3"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  >
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(product.price))}
                  </Typography>
                  {discount > 0 && (
                    <Chip
                      label={`-${discount}%`}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
                {product.originalPrice &&
                  Number(product.originalPrice) > Number(product.price) && (
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(product.originalPrice))}
                    </Typography>
                  )}
              </Box>

              {/* Stock Status */}
              <Box sx={{ mb: 3 }}>
                {product.inStock && (product.stockQuantity || 0) > 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "success.main",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ fontWeight: 600 }}
                    >
                      Còn hàng ({product.stockQuantity || 0} sản phẩm)
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="error.main"
                    sx={{ fontWeight: 600 }}
                  >
                    Hết hàng
                  </Typography>
                )}
              </Box>

              {/* Short Description */}
              {product.shortDescription && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                  {product.shortDescription}
                </Typography>
              )}

              {/* Quantity Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Số lượng:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      sx={{ borderRadius: 0 }}
                    >
                      -
                    </IconButton>
                    <Typography
                      sx={{
                        px: 2,
                        py: 1,
                        minWidth: 60,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setQuantity(
                          Math.min(product.stockQuantity || 1, quantity + 1)
                        )
                      }
                      sx={{ borderRadius: 0 }}
                    >
                      +
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleBuyNow}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? "Đang xử lý..." : "Mua ngay"}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<ShoppingCart />}
                  onClick={handleAddToCart}
                  disabled={
                    !product.inStock || (product.stockQuantity || 0) === 0
                  }
                  sx={{
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
                  Thêm vào giỏ hàng
                </Button>
                <IconButton
                  size="large"
                  onClick={handleToggleFavorite}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    borderRadius: 2,
                    color: isFavorite ? theme.palette.error.main : "inherit",
                    backgroundColor: isFavorite
                      ? alpha(theme.palette.error.main, 0.1)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isFavorite
                        ? alpha(theme.palette.error.main, 0.2)
                        : alpha(theme.palette.action.hover, 0.1),
                    },
                  }}
                >
                  <Favorite />
                </IconButton>
                <IconButton
                  size="large"
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    borderRadius: 2,
                  }}
                >
                  <Share />
                </IconButton>
              </Stack>

              {/* Features */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  Đặc điểm nổi bật:
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalShipping
                      sx={{ fontSize: 20, color: "primary.main" }}
                    />
                    <Typography variant="body2">Giao hàng miễn phí</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Security sx={{ fontSize: 20, color: "primary.main" }} />
                    <Typography variant="body2">Bảo hành 24 tháng</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SupportAgent
                      sx={{ fontSize: 20, color: "primary.main" }}
                    />
                    <Typography variant="body2">
                      Hỗ trợ kỹ thuật 24/7
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Refresh sx={{ fontSize: 20, color: "primary.main" }} />
                    <Typography variant="body2">
                      Đổi trả trong 30 ngày
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Tags:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {product.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Product Details Tabs */}
        <Paper
          sx={{
            mt: 4,
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Mô tả" />
              <Tab label="Thông số kỹ thuật" />
              <Tab label="Đánh giá" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {product.description}
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box>
              {specificationsToDisplay.length > 0 ? (
                specificationsToDisplay.map((spec: any, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: `1px solid ${alpha(
                        theme.palette.divider,
                        0.1
                      )}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {spec.key || spec.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {spec.value}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  Sản phẩm chưa có thông số kỹ thuật chi tiết.
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Đánh giá từ khách hàng
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm
                này!
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </Fade>
  );
};

export default ProductDetail;

// This is a fallback function that will be used if notistack's useSnackbar is not available
function enqueueSnackbar(
  message: string,
  options: {
    variant: "success" | "error" | "warning" | "info";
    autoHideDuration?: number;
  }
) {
  // Default implementation that falls back to browser's alert
  if (options.variant === "error") {
    console.error(message);
  } else {
    console.log(message);
    alert(`Lỗi: ${message}`);
  }
}

import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Rating,
  IconButton,
  Snackbar,
  Alert,
  CardActionArea,
} from "@mui/material";
import { Favorite, FavoriteBorder, ShoppingCart } from "@mui/icons-material";
import { Link } from "react-router-dom";
import type { Product } from "../types/product";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";
import {
  getFirstProductImage,
  getProductImageByIndex,
  hasMultipleImages,
} from "../utils/imageUtils";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToFavorites, removeFromFavorites } = useFavorites();
  const [showFavoriteAlert, setShowFavoriteAlert] = React.useState(false);
  const [showCartAlert, setShowCartAlert] = React.useState(false);
  const [favoriteMessage, setFavoriteMessage] = React.useState("");
  const Cart = useCart();
  const currentQuantity = Cart.getTotalItems();
  const [isFav, setIsFav] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Get images directly from product data
  const productImage = React.useMemo(() => {
    return getFirstProductImage(product);
  }, [product]);

  const hoverImage = React.useMemo(() => {
    if (hasMultipleImages(product)) {
      return getProductImageByIndex(product, 1);
    }
    return "";
  }, [product]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const pid = String(product.id);
    if (isFav) {
      await removeFromFavorites(pid);
      setFavoriteMessage("Đã bỏ yêu thích");
    } else {
      await addToFavorites(pid);
      setFavoriteMessage("Đã thêm vào yêu thích");
    }
    setShowFavoriteAlert(true);
    setIsFav(!isFav);
    setTimeout(() => {
      setShowFavoriteAlert(false);
    }, 2000);
  };

  const handleAddToCart = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await Cart.addToCart(String(product.id), 1);
      setShowCartAlert(true);
      setTimeout(() => {
        setShowCartAlert(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleCloseFavoriteAlert = () => setShowFavoriteAlert(false);
  const handleCloseCartAlert = () => setShowCartAlert(false);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
          position: "relative",
        }}
      >
        {discount > 0 && (
          <Chip
            label={`-${discount}%`}
            color="error"
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          />
        )}

        <IconButton
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
          }}
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Bỏ yêu thích" : "Thêm yêu thích"}
        >
          {isFav ? <Favorite color="error" /> : <FavoriteBorder />}
        </IconButton>

        {/* Wrap clickable area with CardActionArea -> Link */}
        <CardActionArea
          component={Link}
          to={`/products/${product.slug}`}
          sx={{ flexShrink: 0, position: "relative", overflow: "hidden" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Image */}
          <CardMedia
            component="img"
            src={productImage}
            alt={product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/placeholder-image.png";
            }}
            sx={{
              height: 200,
              objectFit: "contain",
              p: 2,
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
              transition: "opacity 0.3s ease-in-out",
              opacity: isHovered && hoverImage ? 0 : 1,
            }}
          />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isHovered
                    ? "rgba(0,0,0,0.3)"
                    : "primary.main",
                  transition: "background-color 0.3s",
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isHovered
                    ? "primary.main"
                    : "rgba(0,0,0,0.3)",
                  transition: "background-color 0.3s",
                }}
              />
        </CardActionArea>

        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              height: "3em",
            }}
            component={Link}
            to={`/products/${product.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {product.name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating value={product.rating} size="small" readOnly />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({product.reviewCount})
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color={
              (product.stock ?? product.stockQuantity ?? 0) > 0
                ? "success.main"
                : "error"
            }
            sx={{ mb: 2 }}
          >
            {(product.stock ?? product.stockQuantity ?? 0) > 0
              ? `Còn ${product.stock ?? product.stockQuantity ?? 0} sản phẩm`
              : "Hết hàng"}
          </Typography>

          {currentQuantity > 0 && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ mb: 1, fontWeight: "bold" }}
            >
              Đã có {currentQuantity} trong giỏ
            </Typography>
          )}

          <Box sx={{ mt: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="h6" color="primary">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.price)}
              </Typography>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: "line-through" }}
                  >
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.originalPrice)}
                  </Typography>
                )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={handleAddToCart}
              disabled={(product.stock ?? product.stockQuantity ?? 0) === 0}
              sx={{
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {(product.stock ?? product.stockQuantity ?? 0) > 0
                ? "Thêm vào giỏ"
                : "Hết hàng"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Favorite Snackbar */}
      <Snackbar
        open={showFavoriteAlert}
        autoHideDuration={2000}
        onClose={handleCloseFavoriteAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleCloseFavoriteAlert}
          severity="info"
          sx={{ width: "100%" }}
        >
          {favoriteMessage}
        </Alert>
      </Snackbar>

      {/* Cart Snackbar */}
      <Snackbar
        open={showCartAlert}
        autoHideDuration={2000}
        onClose={handleCloseCartAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleCloseCartAlert}
          severity="success"
          sx={{ width: "100%" }}
        >
          Đã thêm <strong>{product.name}</strong> vào giỏ hàng!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductCard;

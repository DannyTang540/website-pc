// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Fade,
  CircularProgress,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import type { Product } from "../types/product";
import BannerSlider from "../components/Banner";
import { productService } from "../services/productService";
import ProductCard from "../components/ProductCard";

const Home: React.FC = () => {
  const theme = useTheme();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favOpen, setFavOpen] = useState(false);
  const [favMessage, setFavMessage] = useState("");
  const [favError, setFavError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        const response = await productService.getFeaturedProducts();
        if (isMounted) {
          const products = Array.isArray(response) ? response : [];
          setFeaturedProducts(products);
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
        if (isMounted) {
          setFeaturedProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box>
      {/* BANNER SLIDER */}
      <BannerSlider />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Featured Products Section */}
        <Fade in={!loading} timeout={600}>
          <Box>
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
                Sản Phẩm Nổi Bật
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
              >
                Khám phá những sản phẩm PC được ưa chuộng nhất với công nghệ
                tiên tiến và thiết kế đẳng cấp
              </Typography>
            </Box>

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 12,
                }}
              >
                <CircularProgress size={48} thickness={4} />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 4,
                }}
              >
                {featuredProducts.map((product, index) => (
                  <Fade
                    in={!loading}
                    timeout={800 + index * 100}
                    key={product.id}
                  >
                    <Box sx={{ height: "100%" }}>
                      <ProductCard product={product} />
                    </Box>
                  </Fade>
                ))}
              </Box>
            )}
          </Box>
        </Fade>

        {/* Features Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            mb: 6,
          }}
        >
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" gutterBottom color="primary">
              🚀 Giao Hàng Nhanh
            </Typography>
            <Typography>
              Giao hàng trong ngày tại Hà Nội & TP.HCM. Miễn phí vận chuyển toàn
              quốc.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" gutterBottom color="primary">
              🔧 Bảo Hành Dài Hạn
            </Typography>
            <Typography>
              Bảo hành 36 tháng cho PC Gaming, 12 tháng cho linh kiện. Hỗ trợ kỹ
              thuật 24/7.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" gutterBottom color="primary">
              💳 Thanh Toán Linh Hoạt
            </Typography>
            <Typography>
              Trả góp 0% qua thẻ tín dụng. COD, chuyển khoản, ví điện tử đa
              dạng.
            </Typography>
          </Box>
        </Box>
        <Snackbar
          open={favOpen}
          autoHideDuration={3000}
          onClose={() => {
            setFavOpen(false);
            setFavError(null);
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => {
              setFavOpen(false);
              setFavError(null);
            }}
            severity={favError ? "error" : "success"}
            sx={{ width: "100%" }}
          >
            {favError || favMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Home;

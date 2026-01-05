import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Stack,
  Chip,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import type { Product, ProductFilter } from "../types/product";
import { productService } from "../services/productService";
import {
  ExpandMore,
  Star,
  Favorite,
  ShoppingCart,
  Visibility,
} from "@mui/icons-material";
import { getFirstProductImage } from "../utils/imageUtils";

interface CategoryGroup {
  category: string;
  products: Product[];
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, favorites } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | false>(
    false
  );
  const [visibleCategories, setVisibleCategories] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build filter object
        const filter: ProductFilter = {
          page: 1,
          limit: 100, // Fetch more items to ensure we get all categories
          status: "active", // Only fetch active products
        };

        // Add category filter if specified in URL
        if (categoryParam) {
          filter.categoryId = categoryParam;
        }

        console.log("Fetching products with filter:", filter);

        // Fetch products with the filter
        const { products: fetchedProducts } = await productService.getProducts(
          filter
        );

        // DEBUG: Kiểm tra dữ liệu nhận được
        console.log("Raw API response - first product:", fetchedProducts[0]);
        console.log("All products count:", fetchedProducts.length);

        // Debug chi tiết cho mỗi sản phẩm
        fetchedProducts.forEach((p, i) => {
          console.log(`Product ${i} - ${p.name}:`, {
            hasImages: Array.isArray(p.images),
            imagesCount: p.images?.length || 0,
            hasImage: !!p.image,
            imageValue: p.image,
            productId: p.id,
            slug: p.slug,
          });
        });

        if (!fetchedProducts || fetchedProducts.length === 0) {
          setError("Không tìm thấy sản phẩm nào");
          setProducts([]);
          return;
        }

        setProducts(fetchedProducts);

        // If there's a category parameter, expand that category
        if (categoryParam) {
          const firstProduct = fetchedProducts[0];
          if (firstProduct?.category) {
            setExpandedCategory(firstProduct.category);
          } else if (firstProduct?.categoryId) {
            // If category name is not available, use categoryId
            setExpandedCategory(firstProduct.categoryId);
          }
        } else if (fetchedProducts.length > 0) {
          // Expand the first category by default if no specific category is selected
          const firstProduct = fetchedProducts[0];
          if (firstProduct?.category) {
            setExpandedCategory(firstProduct.category);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        setError("Đã xảy ra lỗi khi tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam]);

  // Format price to VND
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Group products by category
  const categoryGroups = useMemo(() => {
    const groups: CategoryGroup[] = [];
    const categoryMap = new Map<string, Product[]>();

    // If no products, return empty array
    if (!products || products.length === 0) {
      return [];
    }

    // Filter products based on search term
    const filteredProducts = products.filter((product) => {
      // If there's a category filter and this product doesn't match, filter it out
      if (categoryParam && product.categoryId !== categoryParam) {
        return false;
      }

      // If no search term, include all (filtered by category above)
      if (!searchTerm) return true;

      // Check if product matches search term
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        (product.tags &&
          Array.isArray(product.tags) &&
          product.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    });

    // If no products after filtering, return empty array
    if (filteredProducts.length === 0) {
      return [];
    }

    // Group by category
    filteredProducts.forEach((product) => {
      // Use category name if available, otherwise use categoryId, fallback to "Chưa phân loại"
      const categoryName =
        product.category || product.categoryId || "Chưa phân loại";
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)?.push(product);
    });

    // Convert to array and sort categories
    categoryMap.forEach((products, category) => {
      groups.push({
        category,
        products: products.sort((a, b) => a.name.localeCompare(b.name)),
      });
    });

    // Sort categories alphabetically
    return groups.sort((a, b) => a.category.localeCompare(b.category));
  }, [products, searchTerm, categoryParam]);

  const isFavorite = (productId: string) => {
    return favorites?.some((fav) => fav?.id === productId) || false;
  };

  const handleCategoryChange =
    (category: string) =>
    (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedCategory(isExpanded ? category : false);
    };

  const handleLoadMore = () => {
    setVisibleCategories((prev) => prev + 2);
  };

const handleAddToCart = async (product: Product) => {
  try {
    await addToCart(String(product.id), 1);
    // You might want to add a success notification here
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

  const handleToggleFavorite = (product: Product) => {
    if (!product?.id) return;

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product.id);
    }
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.slug}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <Typography variant="h6">Đang tải sản phẩm...</Typography>
        </Box>
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
          textAlign: "center",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Tất Cả Sản Phẩm
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Thử lại
          </Button>
        </Box>
      ) : categoryGroups.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy sản phẩm nào phù hợp
          </Typography>
          {searchTerm && (
            <Button
              variant="outlined"
              onClick={() => setSearchTerm("")}
              sx={{ mt: 2 }}
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          )}
        </Box>
      ) : (
        <Stack spacing={3}>
          {categoryGroups.slice(0, visibleCategories).map((group, index) => (
            <Fade key={group.category} in={true} timeout={500 + index * 100}>
              <Paper
                elevation={3}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))`,
                }}
              >
                <Accordion
                  expanded={expandedCategory === group.category}
                  onChange={handleCategoryChange(group.category)}
                  sx={{
                    "&:before": { display: "none" },
                    boxShadow: "none",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                      color: "white",
                      "& .MuiAccordionSummary-content": {
                        margin: "12px 0",
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {group.category} ({group.products.length} sản phẩm)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3,
                        "& > *": {
                          flex: "1 1 250px",
                          maxWidth: "100%",
                          "@media (min-width: 600px)": {
                            flex: "1 1 calc(50% - 12px)",
                            maxWidth: "calc(50% - 12px)",
                          },
                          "@media (min-width: 900px)": {
                            flex: "1 1 calc(33.333% - 16px)",
                            maxWidth: "calc(33.333% - 16px)",
                          },
                          "@media (min-width: 1200px)": {
                            flex: "1 1 calc(20% - 16px)",
                            maxWidth: "calc(20% - 16px)",
                          },
                        },
                      }}
                    >
                      {group.products.map((product) => (
                        <Box key={product.id}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              position: "relative",
                              overflow: "hidden",
                              "&:hover": {
                                transform: "translateY(-8px)",
                                boxShadow: theme.shadows[8],
                                "& .product-image": {
                                  transform: "scale(1.05)",
                                },
                                "& .product-actions": {
                                  opacity: 1,
                                },
                              },
                            }}
                            onClick={() => handleViewProduct(product)}
                          >
                            {product.isFeatured && (
                              <Chip
                                label="Nổi bật"
                                color="secondary"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  zIndex: 1,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                            <CardMedia
                              component="img"
                              image={getFirstProductImage(product) || "/placeholder-image.png"}
                              alt={product.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = "/placeholder-image.png";
                              }}
                              sx={{
                                height: 200,
                                objectFit: "contain",
                                transition: "transform 0.3s ease",
                                className: "product-image",
                                backgroundColor: "#f5f5f5",
                              }}
                            />
                            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                              <Typography
                                variant="h6"
                                component="h3"
                                sx={{
                                  fontWeight: "bold",
                                  mb: 1,
                                  fontSize: "0.9rem",
                                  lineHeight: 1.3,
                                  height: 48,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {product.name}
                              </Typography>
                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.8rem" }}
                                >
                                  {product.brand}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Star
                                    sx={{
                                      fontSize: 16,
                                      color: "#FFD700",
                                      mr: 0.5,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ fontSize: "0.8rem" }}
                                  >
                                    {product.rating || 4.0}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.8rem" }}
                                >
                                  ({product.reviewCount || 0})
                                </Typography>
                              </Box>
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  sx={{ fontWeight: "bold", fontSize: "1rem" }}
                                >
                                  {formatPrice(product.price)}
                                </Typography>
                                {product.originalPrice &&
                                  product.originalPrice > product.price && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        textDecoration: "line-through",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {formatPrice(product.originalPrice)}
                                    </Typography>
                                  )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 2,
                                }}
                              >
                                <Chip
                                  label={
                                    product.stock && product.stock > 0
                                      ? `Còn hàng (${product.stock})`
                                      : "Hết hàng"
                                  }
                                  color={
                                    product.stock && product.stock > 0
                                      ? "success"
                                      : "error"
                                  }
                                  size="small"
                                  sx={{ fontSize: "0.7rem" }}
                                />
                              </Box>
                            </CardContent>
                            <Box
                              className="product-actions"
                              sx={{
                                p: 2,
                                pt: 0,
                                opacity: 0,
                                transition: "opacity 0.3s ease",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<ShoppingCart />}
                                  onClick={() => handleAddToCart(product)}
                                  disabled={
                                    !product.stock || product.stock === 0
                                  }
                                  sx={{ flex: 1, fontSize: "0.8rem" }}
                                >
                                  Thêm vào giỏ
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleFavorite(product)}
                                  sx={{
                                    color: isFavorite(product.id)
                                      ? "error.main"
                                      : "text.secondary",
                                  }}
                                >
                                  <Favorite />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewProduct(product)}
                                  sx={{ color: "text.secondary" }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Card>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Fade>
          ))}

          {/* Load More Button */}
          {!categoryParam && visibleCategories < categoryGroups.length && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleLoadMore}
                sx={{
                  px: 6,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  },
                }}
              >
                Xem thêm ({categoryGroups.length - visibleCategories} danh mục
                còn lại)
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default Products;

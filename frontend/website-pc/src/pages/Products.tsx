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
  useTheme,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import type { Product, ProductFilter } from "../types/product";
import { productService } from "../services/productService";
import { Star, Favorite, ShoppingCart, Visibility } from "@mui/icons-material";
import { getFirstProductImage } from "../utils/imageUtils";
import { categoryService } from "../services/categoryService";

interface CategoryGroup {
  category: string;
  title: string;
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
  const [error, setError] = useState<string | null>(null);
  const [categoryNameById, setCategoryNameById] = useState<
    Record<string, string>
  >({});
  const [categoryIdBySlug, setCategoryIdBySlug] = useState<
    Record<string, string>
  >({});
  const [categoryIdByNameLower, setCategoryIdByNameLower] = useState<
    Record<string, string>
  >({});
  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("categoryId");
  const categoryParam = searchParams.get("category");

  const resolveCategoryId = (raw: string | null): string | null => {
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;

    // Direct id
    if (categoryNameById[value]) return value;

    // Slug
    const bySlug = categoryIdBySlug[value.toLowerCase()];
    if (bySlug) return bySlug;

    // Name
    const byName = categoryIdByNameLower[value.toLowerCase()];
    if (byName) return byName;

    // Looks like UUID -> treat as id even if map isn't loaded yet
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
      )
    ) {
      return value;
    }

    return null;
  };

  const selectedCategoryId =
    categoryIdParam || resolveCategoryId(categoryParam) || null;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoryService.getCategories();
        const map: Record<string, string> = {};
        const slugToId: Record<string, string> = {};
        const nameToId: Record<string, string> = {};
        (categories || []).forEach((c: any) => {
          const id = c?.id ?? c?._id;
          const name = c?.name;
          const slug = c?.slug;
          if (id && name) {
            map[String(id)] = String(name);
            nameToId[String(name).toLowerCase()] = String(id);
          }
          if (id && slug) {
            slugToId[String(slug).toLowerCase()] = String(id);
          }
        });
        setCategoryNameById(map);
        setCategoryIdBySlug(slugToId);
        setCategoryIdByNameLower(nameToId);
      } catch {
        // Non-blocking: products can still render with fallback category strings.
        setCategoryNameById({});
        setCategoryIdBySlug({});
        setCategoryIdByNameLower({});
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build base filter
        const baseFilter: ProductFilter = {
          limit: 100,
        };

        // Add category filter if specified in URL
        if (selectedCategoryId) {
          baseFilter.categoryId = selectedCategoryId;
        } else if (categoryParam) {
          // Fallback for older links that pass slug/name; backend will try to resolve.
          baseFilter.category = categoryParam;
        }

        // Fetch ALL pages so /product shows full catalog
        const allProducts: Product[] = [];
        let page = 1;
        let totalPages = 1;
        const maxPages = 50;

        do {
          const { products: pageProducts, totalPages: pages } =
            await productService.getProducts({ ...baseFilter, page });

          if (Array.isArray(pageProducts) && pageProducts.length > 0) {
            allProducts.push(...pageProducts);
          }

          totalPages = Math.max(1, Number(pages || 1));
          page += 1;
        } while (page <= totalPages && page <= maxPages);

        // Deduplicate by id (defensive)
        const uniqById = new Map<string, Product>();
        allProducts.forEach((p) => {
          if (p?.id) uniqById.set(String(p.id), p);
        });
        const fetchedProducts = Array.from(uniqById.values());

        if (!fetchedProducts || fetchedProducts.length === 0) {
          setError("Không tìm thấy sản phẩm nào");
          setProducts([]);
          return;
        }

        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        setError("Đã xảy ra lỗi khi tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, categoryIdParam, selectedCategoryId]);

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
      // If there's a category filter, match by category id, slug/name (resolved), or name
      if (categoryParam || categoryIdParam) {
        const productCategoryId = product.categoryId || "";
        const productCategoryName =
          categoryNameById[productCategoryId] || product.category || "";

        if (selectedCategoryId) {
          if (productCategoryId !== selectedCategoryId) return false;
        } else if (categoryParam) {
          const needle = String(categoryParam).toLowerCase();
          const hay = String(productCategoryName).toLowerCase();
          if (hay !== needle && productCategoryId !== categoryParam)
            return false;
        }
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
      const key = product.categoryId || product.category || "__uncategorized__";
      if (!categoryMap.has(key)) {
        categoryMap.set(key, []);
      }
      categoryMap.get(key)?.push(product);
    });

    // Convert to array and sort categories
    categoryMap.forEach((products, category) => {
      const title =
        category === "__uncategorized__"
          ? "Chưa phân loại"
          : categoryNameById[category] || category;
      groups.push({
        category,
        title,
        products: products.sort((a, b) => a.name.localeCompare(b.name)),
      });
    });

    // Sort categories alphabetically
    return groups.sort((a, b) => a.title.localeCompare(b.title));
  }, [
    products,
    searchTerm,
    categoryParam,
    categoryIdParam,
    selectedCategoryId,
    categoryNameById,
  ]);

  const isFavorite = (productId: string) => {
    return favorites?.some((fav) => fav?.id === productId) || false;
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(String(product.id), 1);
      // You might want to add a success notification here
    } catch (error) {
      console.error("Error adding to cart:", error);
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
    navigate(`/products/${product.slug}`);
  };

  const getStockQuantity = (product: Product): number => {
    const value = product.stockQuantity ?? product.stock ?? 0;
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : 0;
  };

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );

  const handleViewAllCategory = (group: CategoryGroup) => {
    if (group.category === "__uncategorized__") return;

    // If we already filtered to a category, don't navigate redundantly
    if (selectedCategoryId && isUuid(group.category)) {
      if (selectedCategoryId === group.category) return;
    }

    if (isUuid(group.category)) {
      navigate(`/product?categoryId=${encodeURIComponent(group.category)}`);
      return;
    }

    // Fallback: use name/slug in `category` param (backend + frontend can resolve)
    navigate(`/product?category=${encodeURIComponent(group.title)}`);
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
          {categoryGroups.map((group, index) => (
            <Fade key={group.category} in={true} timeout={500 + index * 100}>
              <Paper
                elevation={3}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))`,
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {group.title}
                  </Typography>
                  <Chip
                    label={`${group.products.length} sản phẩm`}
                    size="small"
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.6)",
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 3,
                    }}
                  >
                    {group.products.map((product) => (
                      <Box
                        key={product.id}
                        sx={{
                          flexGrow: 1,
                          flexBasis: {
                            xs: "100%",
                            sm: "calc(50% - 24px)",
                            md: "calc(33.333% - 24px)",
                            lg: "calc(25% - 24px)",
                          },
                          maxWidth: {
                            xs: "100%",
                            sm: "calc(50% - 24px)",
                            md: "calc(33.333% - 24px)",
                            lg: "calc(25% - 24px)",
                          },
                        }}
                      >
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
                            image={
                              getFirstProductImage(product) ||
                              "/placeholder-image.png"
                            }
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
                              backgroundColor: theme.palette.background.default,
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
                                    color: theme.palette.warning.main,
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
                              {(() => {
                                const stockQty = getStockQuantity(product);
                                const inStock =
                                  product.inStock ?? Boolean(stockQty > 0);
                                return (
                              <Chip
                                label={
                                  inStock
                                    ? `Còn hàng (${stockQty})`
                                    : "Hết hàng"
                                }
                                color={inStock ? "success" : "error"}
                                size="small"
                                sx={{ fontSize: "0.7rem" }}
                              />
                                );
                              })()}
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
                                disabled={getStockQuantity(product) <= 0}
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

                  {!selectedCategoryId &&
                    group.category !== "__uncategorized__" && (
                      <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => handleViewAllCategory(group)}
                        >
                          Xem tất cả
                        </Button>
                      </Box>
                    )}
                </Box>
              </Paper>
            </Fade>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default Products;

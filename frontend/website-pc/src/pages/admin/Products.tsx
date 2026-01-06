import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import DataTable from "../../components/admin/common/DataTable";
import SearchBar from "../../components/admin/common/SearchBar";
import type { Column } from "../../components/admin/common/DataTable";
import ConfirmDialog from "../../components/admin/common/ComfirmDialog";
import ProductForm from "../../components/admin/forms/ProductForm.tsx";
import { adminService } from "../../services/adminService";
import type { Product as AdminProduct } from "../../types/admin";

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  // Hàm chuẩn hóa dữ liệu sản phẩm từ API
  // In pages/admin/Products.tsx
  const normalizeProduct = (product: any): any => {
    const getImageUrl = (img: any) => {
      // Return empty string if img is falsy or not a string
      if (!img) return "";

      // If img is an object with a url property, use that
      if (typeof img === "object" && img !== null && img.url) {
        return getImageUrl(img.url);
      }

      // If it's a string, process it
      if (typeof img === "string") {
        if (img.startsWith("http") || img.startsWith("//")) {
          return img;
        }
        // Use Vite's import.meta.env instead of process.env
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        // Remove /api suffix if present for static files
        const baseUrl = apiUrl.replace(/\/api$/, "");
        return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
      }

      // For any other case, return empty string
      return "";
    };
    const normalized = {
      ...product,
      // Ensure all required fields have values
      id: product.id || product._id || "",
      name: product.name || "",
      description: product.description || "",
      price: product.price || 0,
      originalPrice: product.originalPrice,
      categoryId: product.categoryId || product.category?._id || "",
      brand: product.brand || "",
      // Handle both string and array image formats
      images: Array.isArray(product.images)
        ? product.images
            .map((img: any) => getImageUrl(img))
            .filter((url: string) => url) // Remove any empty strings
        : product?.image
        ? [getImageUrl(product.image)]
        : [],
      // Handle both specifications and specs
      specifications: product.specifications || product.specs || {},
      specs: product.specs || product.specifications || {},
      stockQuantity: product.stockQuantity || product.stock || 0,
      inStock:
        product.inStock ?? (product.stockQuantity > 0 || product.stock > 0),
      status: product.status || "active",
      featured: product.featured || product.isFeatured || false,
      slug: product.slug || "",
      tags: product.tags || [],
      shortDescription: product.shortDescription || "",
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return normalized;
  };

  // Load products with filters from server
  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.categoryId = categoryFilter;

      console.log("Fetching products with filters:", filters);

      const response = await adminService.products.getAll(filters);
      console.log("API Response:", response);

      if (response && response.data) {
        const { data, total } = response.data;
        const productList = Array.isArray(data) ? data : [];
        const normalizedProducts = productList.map(normalizeProduct);
        setProducts(normalizedProducts);
        setTotal(total || 0);
      } else {
        console.warn("Unexpected API response format:", response);
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load products", err);
      setProducts([]);
      setTotal(0);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const resp = await adminService.categories.getAll();
      const payload: any = resp.data;
      const data = Array.isArray(payload) ? payload : payload?.data ?? payload;
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Tự động load lại khi filter thay đổi
  useEffect(() => {
    loadProducts();
  }, [statusFilter, categoryFilter]);

  // Reload khi pagination thay đổi
  useEffect(() => {
    loadProducts();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    loadProducts();
  };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
    // Chuyển đổi sang AdminProduct cho form
    const productForForm: AdminProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      categoryId: product.categoryId,
      brand: product.brand,
      specifications: product.specifications || {},
      images: product.images,
      stockQuantity: product.stockQuantity,
      inStock: product.inStock,
      status: product.status,
      featured: product.featured,
      slug: product.slug,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
    setEditing(productForForm);
    setFormOpen(true);
  };

  const handleDelete = (product: AdminProduct) => {
    setToDelete(product);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await adminService.products.delete(toDelete.id);
      loadProducts();
    } catch (err) {
      console.error("Delete product failed", err);
      toast.error("Xóa sản phẩm thất bại");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  // pages/admin/Products.tsx
  const handleSave = async (payload: any) => {
    try {
      if (payload instanceof FormData) {
        if (editing?.id) {
          await adminService.products.update(editing.id, payload);
          toast.success("Cập nhật sản phẩm thành công");
        } else {
          await adminService.products.create(payload);
          toast.success("Thêm sản phẩm thành công");
        }
      } else {
        // Legacy fallback: plain object payload
        const dataToSave = {
          ...payload,
          specifications: payload?.specs || payload?.specifications || {},
        };
        delete (dataToSave as any).specs;

        if (editing?.id) {
          await adminService.products.update(editing.id, dataToSave);
          toast.success("Cập nhật sản phẩm thành công");
        } else {
          await adminService.products.create(dataToSave);
          toast.success("Thêm sản phẩm thành công");
        }
      }

      // Refresh the list
      await loadProducts();
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  const handleRefresh = () => {
    setPage(0);
    setSearchTerm("");
    setStatusFilter("");
    setCategoryFilter("");
    loadProducts();
  };

  const categoryMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // Define columns for products
  const columns: Column[] = [
    {
      id: "name",
      label: "Tên sản phẩm",
      minWidth: 250,
      format: (value: string, row: AdminProduct) => {
        // Helper to get image URL from ProductImageType
        const getImageSrc = (img: any): string => {
          if (!img) return "";
          if (typeof img === "string") return img;
          if (typeof img === "object" && img.url) return img.url;
          return "";
        };

        const imageSrc =
          row.images && row.images[0] ? getImageSrc(row.images[0]) : "";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {imageSrc && (
              <img
                src={imageSrc}
                alt={value}
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-product.jpg";
                }}
              />
            )}
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {value}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                SKU: {row.id}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: "price",
      label: "Giá",
      minWidth: 120,
      align: "right" as const,
      format: (value: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value || 0),
    },
    {
      id: "stockQuantity",
      label: "Số lượng",
      minWidth: 100,
      align: "center" as const,
      format: (value: number, row: AdminProduct) => {
        const stockValue = value || row.stockQuantity || 0;
        return (
          <Typography
            variant="body2"
            color={
              stockValue === 0
                ? "error"
                : stockValue < 10
                ? "warning.main"
                : "text.primary"
            }
            fontWeight={stockValue === 0 ? "bold" : "normal"}
          >
            {stockValue}
          </Typography>
        );
      },
    },
    {
      id: "categoryId",
      label: "Danh mục",
      minWidth: 150,
      format: (value: string) => categoryMap[value] || "Chưa phân loại",
    },
    {
      id: "inStock",
      label: "Trạng thái",
      minWidth: 120,
      align: "center" as const,
      format: (value: boolean) => (
        <Box
          sx={{
            display: "inline-block",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: value ? "success.light" : "error.light",
            color: value ? "success.dark" : "error.contrastText",
            fontSize: "0.75rem",
            fontWeight: "bold",
          }}
        >
          {value ? "Còn hàng" : "Hết hàng"}
        </Box>
      ),
    },
    {
      id: "featured",
      label: "Nổi bật",
      minWidth: 100,
      align: "center" as const,
      format: (value: boolean) => (
        <Box
          sx={{
            display: "inline-block",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: value ? "primary.light" : "transparent",
            color: value ? "primary.dark" : "text.secondary",
            border: value ? "1px solid" : "1px dashed",
            borderColor: value ? "primary.main" : "grey.400",
            fontSize: "0.75rem",
          }}
        >
          {value ? "Có" : "Không"}
        </Box>
      ),
    },
  ];

  const pagedProducts = products;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Quản lý sản phẩm
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Thêm sản phẩm
          </Button>
        </Stack>
      </Stack>

      {/* Search & Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="Tìm kiếm sản phẩm..."
            filters={[
              {
                label: "Trạng thái",
                value: statusFilter,
                options: [
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Ẩn" },
                ],
                onChange: (value: string) => {
                  setStatusFilter(value);
                  setPage(0);
                },
              },
              {
                label: "Danh mục",
                value: categoryFilter,
                options: [
                  { value: "", label: "Tất cả danh mục" },
                  ...categories.map((cat: any) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ],
                onChange: (value: string) => {
                  setCategoryFilter(value);
                  setPage(0);
                },
              },
            ]}
            sx={{ width: "100%", "& > *": { flex: 1 } }}
          />
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pagedProducts}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p: number) => setPage(p)}
        onRowsPerPageChange={(r: number) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Không tìm thấy sản phẩm"
      />

      {/* Product Form Modal */}
      <ProductForm
        open={formOpen}
        product={
          editing
            ? {
                ...editing,
                // Convert ProductImageType[] to (string | File)[] for ProductForm compatibility
                images:
                  editing.images
                    ?.map((img: any) =>
                      typeof img === "string" ? img : img?.url || ""
                    )
                    .filter(Boolean) || [],
              }
            : null
        }
        onSave={handleSave}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${toDelete?.name}" không? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Xóa"
        cancelText="Hủy"
        severity="error"
      />
    </Box>
  );
};

export default AdminProducts;

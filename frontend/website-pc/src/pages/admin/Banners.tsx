import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import BannerList from "../../components/admin/BannerList";
import BannerForm from "../../components/admin/forms/BannerForm";
import {
  getBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../../services/bannerService";
import type { Banner } from "../../types/banner";

// Simple Error Boundary for the component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in BannersPage:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Alert severity="error">
            Đã xảy ra lỗi khi tải trang quản lý banner. Vui lòng thử lại sau.
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch banners with error handling
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBannersAdmin();
      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu banner không hợp lệ");
      }
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách banner";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (filter: { searchTerm?: string }) => {
    if (filter.searchTerm !== undefined) {
      setSearchTerm(filter.searchTerm);
      setPage(0);
    }
  };

  const handleOpenForm = (banner?: Banner) => {
    try {
      if (banner) {
        // Create a clean banner object to avoid reference issues
        const bannerToEdit = { ...banner };
        setEditingBanner(bannerToEdit);
      } else {
        setEditingBanner(null);
      }
      setOpenForm(true);
    } catch (error) {
      console.error("Error opening form:", error);
      showSnackbar("Không thể mở biểu mẫu", "error");
    }
  };

  const handleCloseForm = () => {
    try {
      setOpenForm(false);
      // Small delay before resetting the editing banner to prevent UI flicker
      setTimeout(() => setEditingBanner(null), 300);
    } catch (error) {
      console.error("Error closing form:", error);
    }
  };

  // In Banners.tsx
  const handleSubmit = async (formData: FormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        showSnackbar("Cập nhật banner thành công", "success");
      } else {
        await createBanner(formData);
        showSnackbar("Thêm banner thành công", "success");
      }

      // Close form and refresh the list
      handleCloseForm();
      fetchBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu banner";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteBanner = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa banner này không?")) {
      try {
        await deleteBanner(id);
        showSnackbar("Xóa banner thành công", "success");
        fetchBanners();
      } catch (error) {
        console.error("Error deleting banner:", error);
        showSnackbar("Không thể xóa banner", "error");
      }
    }
  };

  const handleToggleStatus = async (id: string, nextStatus: boolean) => {
    try {
      await toggleBannerStatus(id, nextStatus);
      showSnackbar(
        `Đã ${nextStatus ? "bật" : "tắt"} banner thành công`,
        "success"
      );
      fetchBanners();
    } catch (error) {
      console.error("Error toggling banner status:", error);
      showSnackbar("Không thể cập nhật trạng thái banner", "error");
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ searchTerm });
  };

  // Filter banners based on search term
  const filteredBanners = banners.filter(
    (banner) =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const paginatedBanners = filteredBanners.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Quản lý Banner
          </Typography>
          <Button
            variant="contained"
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            onClick={() => handleOpenForm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Thêm Banner"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm banner theo tên hoặc tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchTerm("");
                      handleFilterChange({ searchTerm: "" });
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <BannerList
            banners={paginatedBanners}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            total={filteredBanners.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onEditBanner={handleOpenForm}
            onDeleteBanner={handleDeleteBanner}
            onToggleStatus={handleToggleStatus}
          />
        </Paper>

        <BannerForm
          open={openForm}
          banner={editingBanner}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          loading={isSubmitting}
        />

        <Snackbar open={snackbar.open} autoHideDuration={6000}>
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
};

export default BannersPage;

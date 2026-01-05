import { useState, useCallback, useEffect } from "react";
// Import from the correct path for useSnackbar
import {useSnackbar }  from "./useSnackbar"
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  uploadBannerImage,
} from "../services/bannerService";
import type {
  Banner,
  BannerFormValues,
  BannerFilterOptions,
} from "../types/banner";

const ITEMS_PER_PAGE = 10;

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<BannerFilterOptions>({});
  const [openForm, setOpenForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSnackbar } = useSnackbar();

  const fetchBanners = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      // Remove the type annotation and handle the response properly
      const response = await getBanners();
      if (Array.isArray(response)) {
        setBanners(response);
        setTotal(response.length);
      } else {
        setBanners([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      showSnackbar(`Lỗi khi tải danh sách banner: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  }, [filter, page, rowsPerPage, showSnackbar]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (newFilter: BannerFilterOptions) => {
    setFilter(newFilter);
    setPage(0);
  };

  const handleOpenForm = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
    } else {
      setEditingBanner(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingBanner(null);
  };

  const handleSubmit = async (values: BannerFormValues): Promise<void> => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      // Convert BannerFormValues to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        showSnackbar("Cập nhật banner thành công", "success");
      } else {
        await createBanner(formData);
        showSnackbar("Thêm banner mới thành công", "success");
      }
      await fetchBanners();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving banner:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      showSnackbar(
        `Lỗi khi ${
          editingBanner ? "cập nhật" : "thêm mới"
        } banner: ${errorMessage}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string): Promise<void> => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      return;
    }

    try {
      await deleteBanner(id);
      showSnackbar("Xóa banner thành công", "success");
      await fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      showSnackbar(`Lỗi khi xóa banner: ${errorMessage}`, "error");
    }
  };

  const handleToggleStatus = async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    try {
      await toggleBannerStatus(id, isActive);
      showSnackbar(
        `Đã ${isActive ? "kích hoạt" : "tắt"} banner thành công`,
        "success"
      );
      await fetchBanners();
    } catch (error) {
      console.error("Error toggling banner status:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      showSnackbar(
        `Lỗi khi cập nhật trạng thái banner: ${errorMessage}`,
        "error"
      );
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    try {
      if (!file) {
        throw new Error("Không có tệp được chọn");
      }

      const response = await uploadBannerImage(file);
      if (!response?.url) {
        throw new Error("Không nhận được URL hình ảnh từ máy chủ");
      }
      return response.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      throw new Error(`Lỗi khi tải lên hình ảnh: ${errorMessage}`);
    }
  };

  return {
    banners,
    loading,
    page,
    rowsPerPage,
    total,
    filter,
    openForm,
    editingBanner,
    isSubmitting,
    handlePageChange,
    handleRowsPerPageChange,
    handleFilterChange,
    handleOpenForm,
    handleCloseForm,
    handleSubmit,
    handleDeleteBanner,
    handleToggleStatus,
    handleUploadImage,
    fetchBanners,
  };
};

export default useBanners;

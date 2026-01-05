// components/admin/forms/BannerForm.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Box,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { Banner, BannerFormValues } from "../../../types/banner";

interface BannerFormProps {
  open: boolean;
  banner?: Partial<Banner> | null;
  onSubmit: (values: FormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const BannerForm: React.FC<BannerFormProps> = ({
  open,
  banner,
  onSubmit,
  onClose,
  loading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<BannerFormValues>({
    title: "",
    description: "",
    image: null,
    type: "image",
    position: "top",
    targetUrl: "",
    buttonText: "Xem thêm",
    isActive: true,
    order: 0, // Changed from priority to order
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    opensInNewTab: false,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initialize form when banner prop changes
  useEffect(() => {
    if (banner) {
      setFormValues({
        title: banner.title || "",
        description: banner.description || "",
        image: banner.image || null,
        type: banner.type || "image",
        position: banner.position || "top",
        targetUrl: banner.targetUrl || banner.link || "",
        buttonText: banner.buttonText || "Xem thêm",
        isActive: banner.isActive ?? true,
        order: banner.order || 0,
        startDate: banner.startDate ? new Date(banner.startDate) : new Date(),
        endDate: banner.endDate
          ? new Date(banner.endDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        opensInNewTab: banner.opensInNewTab ?? false,
      });
      setImagePreview(banner.image || null);
    } else {
      // Reset form for new banner
      setFormValues({
        title: "",
        description: "",
        image: null,
        type: "image",
        position: "top",
        targetUrl: "",
        buttonText: "Xem thêm",
        isActive: true,
        order: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        opensInNewTab: false,
      });
      setImagePreview(null);
    }
  }, [banner, open]);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof BannerFormValues;
    const value = target.type === "checkbox" ? target.checked : target.value;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (
    field: "startDate" | "endDate",
    date: Date | null
  ) => {
    if (date) {
      setFormValues((prev) => ({
        ...prev,
        [field]: date,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
      return;
    }

    // Kiểm tra định dạng file
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(
        "Định dạng file không hợp lệ. Vui lòng chọn file ảnh (JPEG, PNG, WebP)"
      );
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormValues((prev) => ({
      ...prev,
      image: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formValues.title.trim()) {
      setError("Vui lòng nhập tiêu đề banner");
      return;
    }

    if (!formValues.image && !banner?.image) {
      setError("Vui lòng chọn ảnh banner");
      return;
    }

    if (formValues.endDate < formValues.startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    const formData = new FormData();
    formData.append("title", formValues.title);
    formData.append("description", formValues.description);

    if (formValues.image instanceof File) {
      formData.append("image", formValues.image);
    } else if (typeof formValues.image === "string" && formValues.image) {
      // Nếu là URL ảnh cũ
      formData.append("imageUrl", formValues.image);
    }

    formData.append("type", formValues.type);
    formData.append("position", formValues.position);
    formData.append("targetUrl", formValues.targetUrl);
    formData.append("buttonText", formValues.buttonText);
    formData.append("isActive", String(formValues.isActive));
    formData.append("order", String(formValues.order));
    formData.append("startDate", formValues.startDate.toISOString());
    formData.append("endDate", formValues.endDate.toISOString());
    formData.append("opensInNewTab", String(formValues.opensInNewTab));

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting banner:", error);
      setError("Có lỗi xảy ra khi lưu banner. Vui lòng thử lại sau.");
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {banner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ flex: 2 }}>
              <TextField
                name="title"
                label="Tiêu đề banner"
                fullWidth
                margin="normal"
                value={formValues.title}
                onChange={handleInputChange}
                required
              />

              <TextField
                name="description"
                label="Mô tả"
                fullWidth
                multiline
                rows={3}
                margin="normal"
                value={formValues.description}
                onChange={handleInputChange}
              />

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Loại banner</InputLabel>
                  <Select
                    name="type"
                    value={formValues.type}
                    onChange={handleInputChange}
                    label="Loại banner"
                  >
                    <MenuItem value="image">Hình ảnh</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="slider">Slider</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Vị trí hiển thị</InputLabel>
                  <Select
                    name="position"
                    value={formValues.position}
                    onChange={handleInputChange}
                    label="Vị trí hiển thị"
                  >
                    <MenuItem value="top">Đầu trang</MenuItem>
                    <MenuItem value="middle">Giữa trang</MenuItem>
                    <MenuItem value="bottom">Cuối trang</MenuItem>
                    <MenuItem value="sidebar">Thanh bên</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                name="targetUrl"
                label="Đường dẫn đích"
                fullWidth
                margin="normal"
                value={formValues.targetUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />

              <TextField
                name="buttonText"
                label="Văn bản nút"
                fullWidth
                margin="normal"
                value={formValues.buttonText}
                onChange={handleInputChange}
              />

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Ngày bắt đầu"
                    value={formValues.startDate}
                    onChange={(date: Date | null) =>
                      date && handleDateChange("startDate", date)
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        name: "startDate",
                      },
                    }}
                  />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Ngày kết thúc"
                    value={formValues.endDate}
                    onChange={(date: Date | null) =>
                      date && handleDateChange("endDate", date)
                    }
                    minDate={formValues.startDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        name: "endDate",
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box
                sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center" }}
              >
                <FormControl fullWidth>
                  <TextField
                    name="order"
                    label="Độ ưu tiên"
                    type="number"
                    value={formValues.order}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                  />
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formValues.isActive}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Kích hoạt"
                  labelPlacement="start"
                />

                <FormControlLabel
                  control={
                    <Switch
                      name="opensInNewTab"
                      checked={formValues.opensInNewTab}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Mở tab mới"
                  labelPlacement="start"
                />
              </Box>
            </Box>

            {/* Image Upload Section */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Box
                sx={{
                  border: "1px dashed #ccc",
                  borderRadius: 1,
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {error && (
                  <Box sx={{ color: "error.main", mt: 2, textAlign: "center" }}>
                    {error}
                  </Box>
                )}
                {imagePreview ? (
                  <Box sx={{ textAlign: "center" }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Banner preview"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 300,
                        mb: 2,
                        borderRadius: 1,
                        objectFit: "contain",
                        bgcolor: "background.paper",
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      component="label"
                      fullWidth
                      disabled={loading}
                    >
                      Thay đổi ảnh
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleImageChange}
                        disabled={loading}
                      />
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Tỷ lệ khuyến nghị: 1200x400px
                      <br />
                      Định dạng: JPG, PNG, WebP (tối đa 5MB)
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      fullWidth
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : null
                      }
                    >
                      Tải ảnh lên
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleImageChange}
                        required={!banner}
                        disabled={loading}
                      />
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {banner ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BannerForm;

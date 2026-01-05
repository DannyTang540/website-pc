import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as PromotionIcon,
  Refresh as RefreshIcon,
  // Event as EventIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";
import {
  promotionService,
  type Promotion as PromotionType,
} from "../../services/promotionService";

interface Promotion extends Omit<PromotionType, "status" | "minOrderAmount"> {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}

const Promotions: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState<PromotionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<
    Omit<Promotion, "id" | "createdAt" | "updatedAt" | "usedCount"> & {
      isActive: boolean;
    }
  >({
    name: "",
    code: "",
    description: "",
    type: "percentage",
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    usageLimit: 100,
  });

  // Fetch promotions from API
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const data = await promotionService.getPromotions();
        setPromotions(data as PromotionType[]);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        alert(
          "Có lỗi xảy ra khi tải danh sách khuyến mãi. Vui lòng thử lại sau."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        ...promo,
        startDate: new Date(promo.startDate),
        endDate: new Date(promo.endDate),
      });
    } else {
      setEditingPromo(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 100,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromo(null);
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "isActive" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleDateChange =
    (name: "startDate" | "endDate") => (date: Date | null) => {
      if (date) {
        setFormData((prev) => ({
          ...prev,
          [name]: date,
        }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const promoData: Omit<
        Promotion,
        "id" | "createdAt" | "updatedAt" | "usedCount"
      > = {
        code: formData.code || "",
        name: formData.name || formData.code || "",
        description: formData.description || "",
        type: formData.type || "percentage",
        value: formData.value || 0,
        minOrderValue: formData.minOrderValue || 0,
        maxDiscount: formData.maxDiscount,
        startDate: formData.startDate || new Date(),
        endDate: formData.endDate || new Date(),
        isActive: formData.isActive !== false,
        usageLimit: formData.usageLimit || 0,
      };

      if (editingPromo) {
        // Update existing promotion
        if (!editingPromo.id) {
          throw new Error("Invalid promotion ID");
        }
        const updatedPromo = await promotionService.updatePromotion(
          editingPromo.id,
          promoData
        );
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === editingPromo.id ? (updatedPromo as PromotionType) : p
          )
        );
      } else {
        // Add new promotion
        const newPromo = await promotionService.createPromotion(promoData);
        setPromotions((prev) => [...prev, newPromo as PromotionType]);
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Có lỗi xảy ra khi lưu khuyến mãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPromotions = (promotions as Promotion[]).filter((promo) =>
    Object.values(promo).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getPromoTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Giảm %";
      case "fixed":
        return "Giảm tiền trực tiếp";
      case "free_shipping":
        return "Miễn phí vận chuyển";
      default:
        return type;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PromotionIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h5" component="h1">
              Quản lý khuyến mãi
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mr: 1 }}
            >
              Thêm khuyến mãi
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await promotionService.getPromotions();
                  setPromotions(data);
                } catch (error) {
                  console.error("Error refreshing promotions:", error);
                  alert("Có lỗi xảy ra khi làm mới danh sách khuyến mãi");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Làm mới
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm khuyến mãi..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3, maxWidth: 500 }}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã khuyến mãi</TableCell>
                  <TableCell>Tên chương trình</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Giá trị</TableCell>
                  <TableCell>Ngày bắt đầu</TableCell>
                  <TableCell>Ngày kết thúc</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Đã sử dụng</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredPromotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromotions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((promo) => (
                      <TableRow key={promo.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="primary"
                          >
                            {promo.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {promo.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {promo.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{getPromoTypeLabel(promo.type)}</TableCell>
                        <TableCell align="right">
                          {promo.type === "percentage"
                            ? `${promo.value}%`
                            : promo.type === "fixed"
                            ? formatCurrency(promo.value)
                            : "Miễn phí vận chuyển"}
                          {promo.type === "percentage" && promo.maxDiscount && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="textSecondary"
                            >
                              Tối đa: {formatCurrency(promo.maxDiscount)}
                            </Typography>
                          )}
                          {promo.minOrderValue && promo.minOrderValue > 0 && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="textSecondary"
                            >
                              Đơn tối thiểu:{" "}
                              {formatCurrency(promo.minOrderValue)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(promo.startDate)}</TableCell>
                        <TableCell>{formatDate(promo.endDate)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              promo.isActive ? <ActiveIcon /> : <InactiveIcon />
                            }
                            label={
                              promo.isActive ? "Đang hoạt động" : "Tạm dừng"
                            }
                            color={promo.isActive ? "success" : "default"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {promo.usedCount}/{promo.usageLimit || "∞"}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(promo)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => console.log("Delete", promo.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPromotions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} trong tổng ${count}`
            }
          />
        </Paper>

        {/* Add/Edit Promotion Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingPromo ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
            </DialogTitle>
            <DialogContent dividers>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    name="code"
                    label="Mã khuyến mãi"
                    value={formData.code}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={!!editingPromo}
                  />
                  <TextField
                    name="name"
                    label="Tên chương trình"
                    value={formData.name}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Box>

                <TextField
                  name="description"
                  label="Mô tả"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Loại khuyến mãi</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      label="Loại khuyến mãi"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="percentage">
                        Giảm % giá trị đơn hàng
                      </MenuItem>
                      <MenuItem value="fixed">Giảm tiền trực tiếp</MenuItem>
                      <MenuItem value="free_shipping">
                        Miễn phí vận chuyển
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {formData.type !== "free_shipping" && (
                    <TextField
                      name="value"
                      label={
                        formData.type === "percentage"
                          ? "Phần trăm giảm giá (%)"
                          : "Số tiền giảm (VNĐ)"
                      }
                      type="number"
                      value={formData.value}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      inputProps={{
                        min: 0,
                        max: formData.type === "percentage" ? 100 : undefined,
                        step: formData.type === "percentage" ? 1 : 1000,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    name="minOrderValue"
                    label="Đơn tối thiểu (VNĐ)"
                    type="number"
                    value={formData.minOrderValue}
                    onChange={handleInputChange}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0, step: 1000 },
                      startAdornment: (
                        <InputAdornment position="start">≥</InputAdornment>
                      ),
                    }}
                  />

                  {formData.type === "percentage" && (
                    <TextField
                      name="maxDiscount"
                      label="Giảm tối đa (VNĐ)"
                      type="number"
                      value={formData.maxDiscount}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        inputProps: { min: 0, step: 1000 },
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <DatePicker
                    label="Ngày bắt đầu"
                    value={formData.startDate}
                    onChange={handleDateChange("startDate")}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />

                  <DatePicker
                    label="Ngày kết thúc"
                    value={formData.endDate}
                    onChange={handleDateChange("endDate")}
                    format="dd/MM/yyyy"
                    minDate={formData.startDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    name="usageLimit"
                    label="Giới hạn sử dụng"
                    type="number"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    fullWidth
                    helperText="Để trống nếu không giới hạn"
                    InputProps={{
                      inputProps: { min: 1 },
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        name="isActive"
                        color="primary"
                      />
                    }
                    label={formData.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      ml: 0,
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDialog} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? <RefreshIcon className="spin" /> : null
                }
              >
                {editingPromo ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Promotions;

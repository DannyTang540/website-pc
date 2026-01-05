import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";
import ConfirmDialog from "../../components/admin/common/ComfirmDialog";

interface FilterCriterion {
  id?: string;
  name: string;
  type: "category" | "brand" | "price" | "specification" | "tag";
  categoryId?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  active: boolean;
}

const FilterCriteria: React.FC = () => {
  const [criteria, setCriteria] = useState<FilterCriterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<FilterCriterion | null>(null);
  const [formData, setFormData] = useState<FilterCriterion>({
    name: "",
    type: "category",
    active: true,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FilterCriterion | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCriteria();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const resp = await adminService.categories.getAll();
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadCriteria = () => {
    try {
      const saved = localStorage.getItem("filterCriteria");
      if (saved) {
        setCriteria(JSON.parse(saved));
      } else {
        // Default criteria
        const defaultCriteria: FilterCriterion[] = [
          { id: "1", name: "Danh mục", type: "category", active: true },
          { id: "2", name: "Thương hiệu", type: "brand", active: true },
          { id: "3", name: "Khoảng giá", type: "price", active: true, minValue: 0, maxValue: 100000000 },
          { id: "4", name: "Thông số kỹ thuật", type: "specification", active: true },
          { id: "5", name: "Thẻ", type: "tag", active: true },
        ];
        setCriteria(defaultCriteria);
        localStorage.setItem("filterCriteria", JSON.stringify(defaultCriteria));
      }
    } catch (error) {
      console.error("Error loading criteria:", error);
    }
  };

  const handleOpenDialog = (criterion?: FilterCriterion) => {
    if (criterion) {
      setEditingCriterion(criterion);
      setFormData(criterion);
    } else {
      setEditingCriterion(null);
      setFormData({ name: "", type: "category", active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCriterion(null);
    setFormData({ name: "", type: "category", active: true });
  };

  const handleSave = () => {
    const updated = editingCriterion
      ? criteria.map((c) => (c.id === editingCriterion.id ? { ...formData, id: c.id } : c))
      : [...criteria, { ...formData, id: Date.now().toString() }];
    
    setCriteria(updated);
    localStorage.setItem("filterCriteria", JSON.stringify(updated));
    handleCloseDialog();
  };

  const handleDelete = (criterion: FilterCriterion) => {
    setToDelete(criterion);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const updated = criteria.filter((c) => c.id !== toDelete.id);
    setCriteria(updated);
    localStorage.setItem("filterCriteria", JSON.stringify(updated));
    setConfirmOpen(false);
    setToDelete(null);
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      category: "Danh mục",
      brand: "Thương hiệu",
      price: "Khoảng giá",
      specification: "Thông số kỹ thuật",
      tag: "Thẻ",
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Quản lý tiêu chí lọc
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCriteria}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm tiêu chí
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên tiêu chí</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Danh mục</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {criteria
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((criterion) => (
                    <TableRow key={criterion.id}>
                      <TableCell>{criterion.name}</TableCell>
                      <TableCell>
                        <Chip label={getTypeLabel(criterion.type)} size="small" />
                      </TableCell>
                      <TableCell>
                        {criterion.categoryId
                          ? categories.find((c) => c.id === criterion.categoryId)?.name || "N/A"
                          : "Tất cả"}
                      </TableCell>
                      <TableCell>
                        {criterion.active ? (
                          <Chip label="Hoạt động" color="success" size="small" />
                        ) : (
                          <Chip label="Tắt" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(criterion)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(criterion)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={criteria.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCriterion ? "Sửa tiêu chí" : "Thêm tiêu chí mới"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên tiêu chí"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Loại</InputLabel>
              <Select
                value={formData.type}
                label="Loại"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as FilterCriterion["type"],
                  })
                }
              >
                <MenuItem value="category">Danh mục</MenuItem>
                <MenuItem value="brand">Thương hiệu</MenuItem>
                <MenuItem value="price">Khoảng giá</MenuItem>
                <MenuItem value="specification">Thông số kỹ thuật</MenuItem>
                <MenuItem value="tag">Thẻ</MenuItem>
              </Select>
            </FormControl>
            {formData.type === "category" && (
              <FormControl fullWidth>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={formData.categoryId || ""}
                  label="Danh mục"
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                >
                  <MenuItem value="">Tất cả danh mục</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {formData.type === "price" && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Giá tối thiểu"
                  type="number"
                  value={formData.minValue || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, minValue: Number(e.target.value) })
                  }
                  fullWidth
                />
                <TextField
                  label="Giá tối đa"
                  type="number"
                  value={formData.maxValue || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, maxValue: Number(e.target.value) })
                  }
                  fullWidth
                />
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
              <Typography sx={{ ml: 1 }}>Kích hoạt</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
            {editingCriterion ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa tiêu chí "${toDelete?.name}" không?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Xóa"
        cancelText="Hủy"
        severity="error"
      />
    </Box>
  );
};

export default FilterCriteria;


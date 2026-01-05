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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import ConfirmDialog from "../../components/admin/common/ComfirmDialog";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface SpecificationTemplate {
  id?: string;
  name: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  required: boolean;
  categoryId?: string;
}

const Specifications: React.FC = () => {
  const [templates, setTemplates] = useState<SpecificationTemplate[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<SpecificationTemplate | null>(null);
  const [formData, setFormData] = useState<SpecificationTemplate>({
    name: "",
    type: "text",
    required: false,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SpecificationTemplate | null>(null);
  // Components management
  const [components, setComponents] = useState<any[]>([]);
  const [compOpen, setCompOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<any | null>(null);
  const [compForm, setCompForm] = useState<{
    type: string;
    name: string;
    attributes: string;
  }>({ type: "CPU", name: "", attributes: "{}" });
  const [viewMode, setViewMode] = useState<"templates" | "components">(
    "templates"
  );
  const [compToDelete, setCompToDelete] = useState<any | null>(null);

  // Load templates from localStorage (tạm thời, có thể thay bằng API)
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem("specTemplates");
      if (saved) {
        setTemplates(JSON.parse(saved));
      } else {
        // Default templates
        const defaultTemplates: SpecificationTemplate[] = [
          { id: "1", name: "CPU", type: "text", required: true },
          { id: "2", name: "GPU", type: "text", required: true },
          { id: "3", name: "RAM", type: "text", required: true },
          { id: "4", name: "Storage", type: "text", required: false },
          { id: "5", name: "Power Supply", type: "text", required: false },
        ];
        setTemplates(defaultTemplates);
        localStorage.setItem("specTemplates", JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  interface ComponentType {
    id: string;
    type: string;
    name: string;
    attributes?: Record<string, any>;
    // Add other fields that your components have
  }

  interface ApiResponse {
    data:
      | {
          components?: ComponentType[];
        }
      | ComponentType[];
    status: number;
  }

  const loadComponents = async () => {
    try {
      console.log("Fetching components from API...");

      // 1. Fetch components from API with proper typing
      const response =
        (await adminService.components.getAll()) as unknown as ApiResponse;

      console.log("Raw API Response:", {
        status: response?.status,
        data: response?.data,
        response: response,
      });

      // 2. Handle different response structures with proper typing
      let components: ComponentType[] = [];

      // Case 1: Response has data.components array
      if (
        response?.data &&
        "components" in response.data &&
        Array.isArray(response.data.components)
      ) {
        console.log("Found components in response.data.components");
        components = response.data.components;
      }
      // Case 2: Response is directly an array
      else if (Array.isArray(response?.data)) {
        console.log("Found components in response.data");
        components = response.data;
      }
      // Case 3: Response is the array itself (unlikely but possible)
      else if (Array.isArray(response)) {
        console.log("Response is the components array");
        components = response;
      }

      console.log("Parsed components:", components);

      // 3. If we have components, use them
      if (components.length > 0) {
        console.log(`Successfully loaded ${components.length} components`);
        setComponents(components);
        return;
      }

      // 4. If no components found, show warning and use fallback
      console.warn("No components found in API response");
      console.log("API Response Structure:", {
        keys: response ? Object.keys(response) : "No response",
        dataKeys: response?.data ? Object.keys(response.data) : "No data",
        isArray: Array.isArray(response),
        response,
      });

      const fallbackComponents = [
        { id: "1", name: "CPU", type: "text", required: true },
        { id: "2", name: "RAM", type: "text", required: true },
        { id: "3", name: "SSD", type: "text", required: false },
      ];

      console.warn("Using fallback components:", fallbackComponents);
      toast.warning("Không tìm thấy linh kiện nào. Đang sử dụng dữ liệu mẫu.");
      setComponents(fallbackComponents);
    } catch (error: any) {
      console.error("Error loading components:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        stack: error.stack,
      });

      const fallbackComponents = [
        { id: "1", name: "CPU", type: "text", required: true },
        { id: "2", name: "RAM", type: "text", required: true },
        { id: "3", name: "SSD", type: "text", required: false },
      ];

      toast.error("Lỗi khi tải linh kiện. Đang sử dụng dữ liệu mẫu.");
      setComponents(fallbackComponents);
    }
  };

  useEffect(() => {
    if (viewMode === "components") {
      loadComponents();
    }
  }, [viewMode]);

  const handleOpenDialog = (template?: SpecificationTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData(template);
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", type: "text", required: false });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    setFormData({ name: "", type: "text", required: false });
  };

  const handleSave = () => {
    const updated = editingTemplate
      ? templates.map((t) =>
          t.id === editingTemplate.id ? { ...formData, id: t.id } : t
        )
      : [...templates, { ...formData, id: Date.now().toString() }];

    setTemplates(updated);
    localStorage.setItem("specTemplates", JSON.stringify(updated));
    handleCloseDialog();
  };

  // Component handlers
  const handleOpenCompDialog = (comp?: any) => {
    if (comp) {
      setEditingComp(comp);
      setCompForm({
        type: comp.type || "CPU",
        name: comp.name || "",
        attributes: JSON.stringify(comp.attributes || {}),
      });
    } else {
      setEditingComp(null);
      setCompForm({ type: "CPU", name: "", attributes: "{}" });
    }
    setCompOpen(true);
  };

  const handleCloseCompDialog = () => {
    setCompOpen(false);
    setEditingComp(null);
    setCompForm({ type: "CPU", name: "", attributes: "{}" });
  };

  const handleSaveComp = async () => {
    try {
      if (!compForm.name || compForm.name.trim() === "") {
        window.alert("Tên linh kiện không được để trống");
        return;
      }
      let attrs: any = {};
      try {
        attrs = JSON.parse(compForm.attributes || "{}");
      } catch (err) {
        window.alert("Thuộc tính linh kiện phải là JSON hợp lệ");
        return;
      }
      const payload = {
        type: compForm.type,
        name: compForm.name.trim(),
        attributes: attrs,
      };
      if (editingComp && editingComp.id) {
        await adminService.components.update(editingComp.id, payload);
      } else {
        await adminService.components.create(payload);
      }
      await loadComponents();
      handleCloseCompDialog();
    } catch (err) {
      console.error("Failed to save component", err);
    }
  };

  const handleDeleteComp = (comp: any) => {
    setCompToDelete(comp);
    setConfirmOpen(true);
  };

  const confirmDeleteComp = async () => {
    if (!compToDelete) return;
    try {
      await adminService.components.delete(compToDelete.id);
      await loadComponents();
    } catch (err) {
      console.error("Failed to delete component", err);
    } finally {
      setCompToDelete(null);
      setConfirmOpen(false);
    }
  };

  const handleDelete = (template: SpecificationTemplate) => {
    setToDelete(template);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const updated = templates.filter((t) => t.id !== toDelete.id);
    setTemplates(updated);
    localStorage.setItem("specTemplates", JSON.stringify(updated));
    setConfirmOpen(false);
    setToDelete(null);
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      text: "Văn bản",
      number: "Số",
      select: "Lựa chọn",
      boolean: "Có/Không",
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
          Quản lý thông số kỹ thuật
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === "templates" ? "contained" : "outlined"}
            onClick={() => setViewMode("templates")}
          >
            Thông số
          </Button>
          <Button
            variant={viewMode === "components" ? "contained" : "outlined"}
            onClick={() => {
              setViewMode("components");
              loadComponents();
            }}
          >
            Linh kiện
          </Button>
          {viewMode === "templates" ? (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadTemplates}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Thêm thông số
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadComponents}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCompDialog()}
              >
                Thêm linh kiện
              </Button>
            </>
          )}
        </Stack>
      </Stack>
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {viewMode === "templates" ? (
                    <>
                      <TableCell>Tên thông số</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Bắt buộc</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Tên linh kiện</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Thuộc tính</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {viewMode === "templates"
                  ? templates
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={getTypeLabel(template.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {template.required ? (
                              <Chip label="Có" color="error" size="small" />
                            ) : (
                              <Chip label="Không" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(template)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(template)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  : components
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell>{comp.name}</TableCell>
                          <TableCell>{comp.type}</TableCell>
                          <TableCell>
                            <pre
                              style={{ maxWidth: 400, whiteSpace: "pre-wrap" }}
                            >
                              {JSON.stringify(comp.attributes || {}, null, 2)}
                            </pre>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenCompDialog(comp)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteComp(comp)}
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
            count={
              viewMode === "templates" ? templates.length : components.length
            }
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
      <>
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingTemplate ? "Sửa thông số" : "Thêm thông số mới"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Tên thông số"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                fullWidth
                required
              />
              <TextField
                select
                label="Loại"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as SpecificationTemplate["type"],
                  })
                }
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="text">Văn bản</option>
                <option value="number">Số</option>
                <option value="select">Lựa chọn</option>
                <option value="boolean">Có/Không</option>
              </TextField>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) =>
                    setFormData({ ...formData, required: e.target.checked })
                  }
                />
                <Typography sx={{ ml: 1 }}>Bắt buộc</Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.name}
            >
              {editingTemplate ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Component Dialog */}
        <Dialog
          open={compOpen}
          onClose={handleCloseCompDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingComp ? "Sửa linh kiện" : "Thêm linh kiện"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Loại linh kiện"
                value={compForm.type}
                onChange={(e) =>
                  setCompForm({ ...compForm, type: e.target.value })
                }
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="CPU">CPU</option>
                <option value="Mainboard">Mainboard</option>
                <option value="RAM">RAM</option>
                <option value="Storage">Storage</option>
                <option value="VGA">VGA</option>
                <option value="PSU">PSU</option>
                <option value="Case">Case</option>
                <option value="Fan">Fan</option>
              </TextField>
              <TextField
                label="Tên linh kiện"
                value={compForm.name}
                onChange={(e) =>
                  setCompForm({ ...compForm, name: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Thuộc tính (JSON)"
                value={compForm.attributes}
                onChange={(e) =>
                  setCompForm({ ...compForm, attributes: e.target.value })
                }
                fullWidth
                multiline
                rows={6}
                helperText="Nhập JSON, ví dụ: { socket: 'AM4', tdp: 65 }"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCompDialog}>Hủy</Button>
            <Button onClick={handleSaveComp} variant="contained">
              {editingComp ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={confirmOpen && !compToDelete}
          title="Xác nhận xóa"
          message={`Bạn có chắc muốn xóa thông số "${toDelete?.name}" không?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
          confirmText="Xóa"
          cancelText="Hủy"
          severity="error"
        />
        <ConfirmDialog
          open={confirmOpen && !!compToDelete}
          title="Xác nhận xóa"
          message={`Bạn có chắc muốn xóa linh kiện "${compToDelete?.name}" không?`}
          onConfirm={confirmDeleteComp}
          onCancel={() => {
            setCompToDelete(null);
            setConfirmOpen(false);
          }}
          confirmText="Xóa"
          cancelText="Hủy"
          severity="error"
        />
      </>
    </Box>
  );
};

export default Specifications;

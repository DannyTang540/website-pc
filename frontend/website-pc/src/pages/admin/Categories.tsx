import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/admin/common/DataTable";
import SearchBar from "../../components/admin/common/SearchBar";
import type { Column } from "../../components/admin/common/DataTable";
import ConfirmDialog from "../../components/admin/common/ComfirmDialog";
import CategoryForm from "../../components/admin/forms/CategoryForm";
import { adminService } from "../../services/adminService";
import type { Category } from "../../types/category";

const AdminCategories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const resp = await adminService.categories.getAll();
      const payload: any = resp.data;
      let data = Array.isArray(payload) ? payload : payload?.data ?? payload;

      // Client-side filtering
      if (searchTerm) {
        data = data.filter((c: Category) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter) {
        data = data.filter((c: Category) => c.status === statusFilter);
      }

      setCategories(data || []);
      setTotal((data && data.length) || 0);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPage(0);
    loadCategories();
  };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setFormOpen(true);
  };

  const handleDelete = (cat: Category) => {
    setToDelete(cat);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await adminService.categories.delete(toDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== toDelete.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleSave = (saved: Category) => {
    setCategories((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
    setTotal((t) => t + (editing ? 0 : 1));
    setFormOpen(false);
    setEditing(null);
  };

  const columns: Column[] = [
    { id: "name", label: "Tên danh mục", minWidth: 250 },
    { id: "description", label: "Mô tả", minWidth: 350 },
    { id: "status", label: "Trạng thái", minWidth: 120 },
  ];

  const handleViewProducts = (cat: Category) => {
    const id = (cat as any)?.id;
    if (!id) return;
    navigate(`/admin/products?categoryId=${encodeURIComponent(String(id))}`);
  };

  const paged = categories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Quản lý danh mục
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadCategories()}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Thêm danh mục
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
            placeholder="Tìm kiếm danh mục..."
            filters={[
              {
                label: "Trạng thái",
                value: statusFilter,
                options: [
                  { value: "", label: "Tất cả" },
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Ẩn" },
                ],
                onChange: (value) => {
                  setStatusFilter(value);
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
        data={paged}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        onView={handleViewProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Không tìm thấy danh mục"
      />

      <CategoryForm
        open={formOpen}
        category={editing}
        onSave={handleSave}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa danh mục "${toDelete?.name}" không?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Xóa"
        cancelText="Hủy"
        severity="error"
      />
    </Box>
  );
};

export default AdminCategories;

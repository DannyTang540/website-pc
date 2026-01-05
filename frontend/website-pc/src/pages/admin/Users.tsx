import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Fade,
  CircularProgress,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import DataTable from "../../components/admin/common/DataTable";
import SearchBar from "../../components/admin/common/SearchBar";
import type { Column } from "../../components/admin/common/DataTable";
import ConfirmDialog from "../../components/admin/common/ComfirmDialog";
import { adminService } from "../../services/adminService";

const AdminUsers: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [toBlock, setToBlock] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState("user");

  // Available roles
  const availableRoles = [
    { value: "user", label: "Người dùng" },
    { value: "admin", label: "Quản trị viên" },
  ];

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const resp = await adminService.users.getAll({
        page: page + 1,
        limit: rowsPerPage,
      });
      let items = resp?.data ?? [];
      const totalServer = resp?.total ?? items.length;

      // Client-side filtering
      if (searchTerm) {
        items = items.filter(
          (u: any) =>
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (roleFilter) {
        items = items.filter((u: any) => u.role === roleFilter);
      }

      setUsers(items || []);
      setTotal(roleFilter || searchTerm ? items.length : totalServer);
    } catch (err) {
      console.error("Load users failed", err);
    } finally {
      setLoading(false);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    load();
  };

  const handleBlock = (u: any) => {
    setToBlock(u);
    setConfirmOpen(true);
  };

  const confirmBlock = async () => {
    if (!toBlock) return;
    const isBlocked = toBlock.role === "blocked";
    try {
      if (isBlocked) {
        await adminService.users.unblockUser(toBlock.id);
      } else {
        await adminService.users.blockUser(toBlock.id);
      }
      load();
    } catch (err) {
      console.error("Block/unblock user failed", err);
    } finally {
      setConfirmOpen(false);
      setToBlock(null);
    }
  };

  const handleChangeRole = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
    setRoleChangeOpen(true);
  };

  const handleDelete = (user: any) => {
    setToDelete(user);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    // Prevent deletion of admin accounts
    if (toDelete.role === "admin") {
      alert("Không thể xóa tài khoản quản trị viên.");
      return;
    }
    try {
      await adminService.users.delete(toDelete.id);
      load();
    } catch (err) {
      console.error("Delete user failed", err);
    } finally {
      setConfirmDeleteOpen(false);
      setToDelete(null);
    }
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    // Prevent changing role if it would exceed 2 admins
    if (newRole === "admin" && adminCount >= 2) {
      alert("Chỉ được phép có tối đa 2 tài khoản quản trị viên.");
      return;
    }
    try {
      await adminService.users.updateRole(selectedUser.id, newRole);
      load();
      setRoleChangeOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Update role failed", err);
    }
  };

  const columns: Column[] = [
    { id: "email", label: "Email", minWidth: 240 },
    {
      id: "firstName",
      label: "Họ tên",
      minWidth: 200,
      format: (_: any, row?: any) =>
        `${row?.firstName} ${row?.lastName || ""}`.trim(),
    },
    { id: "phone", label: "SĐT", minWidth: 140 },
    {
      id: "role",
      label: "Vai trò",
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={value === "admin" ? "Quản trị viên" : "Người dùng"}
          color={value === "admin" ? "primary" : "default"}
          size="small"
        />
      ),
    },
    {
      id: "points",
      label: "Điểm",
      minWidth: 100,
      format: (value: number) =>
        value != null ? value.toLocaleString("vi-VN") : "0",
    },
    {
      id: "membership",
      label: "Hạng thành viên",
      minWidth: 140,
      format: (value: string) => {
        const membershipLabels: Record<string, string> = {
          bronze: "Đồng",
          silver: "Bạc",
          gold: "Vàng",
          platinum: "Bạch kim",
          diamond: "Kim cương",
        };
        const label =
          membershipLabels[value?.toLowerCase()] || value || "Không";
        return (
          <Chip
            label={label}
            color={
              value?.toLowerCase() === "diamond"
                ? "secondary"
                : value?.toLowerCase() === "platinum"
                ? "primary"
                : value?.toLowerCase() === "gold"
                ? "warning"
                : "default"
            }
            size="small"
          />
        );
      },
    },
    {
      id: "createdAt",
      label: "Tạo lúc",
      minWidth: 150,
      format: (value) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      id: "actions",
      label: "Thao tác",
      minWidth: 150,
      align: "center" as const,
      format: (_: any, row: any) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Thay đổi vai trò">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleChangeRole(row)}
              disabled={row.role === "admin" && adminCount <= 1}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chặn người dùng">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleBlock(row)}
              disabled={row.role === "admin"}
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá người dùng">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(row)}
              disabled={row.role === "admin"}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={!loading} timeout={300}>
        <Box>
          {/* Header Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>\')',
                opacity: 0.3,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap={3}
              flexWrap="wrap"
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <AdminIcon sx={{ fontSize: 40 }} />
                  Quản lý người dùng
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Tổng số: {total} người dùng | {adminCount} quản trị viên
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <RefreshIcon />
                  )
                }
                onClick={() => load()}
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "Đang tải..." : "Làm mới"}
              </Button>
            </Stack>
          </Paper>

          {/* Stats Cards */}
          <Stack direction={{ xs: "column", md: "row" }} gap={3} mb={4}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                flex: 1,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.palette.primary.main,
                    color: "white",
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tổng người dùng
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={2}
              sx={{
                p: 3,
                flex: 1,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.warning.main,
                  0.05
                )} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.palette.warning.main,
                    color: "white",
                  }}
                >
                  <AdminIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {adminCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Quản trị viên
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={2}
              sx={{
                p: 3,
                flex: 1,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: theme.palette.success.main,
                    color: "white",
                  }}
                >
                  <ShieldIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {users.filter((u) => u.role === "user").length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Người dùng thường
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* Search & Filter Bar */}
          <Card
            elevation={2}
            sx={{
              mb: 4,
              borderRadius: 3,
              "&:hover": {
                boxShadow: theme.shadows[8],
              },
              transition: "box-shadow 0.3s ease",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="Tìm kiếm theo email, tên..."
                filters={[
                  {
                    label: "Vai trò",
                    value: roleFilter,
                    options: [
                      { value: "", label: "Tất cả" },
                      { value: "user", label: "Người dùng" },
                      { value: "admin", label: "Admin" },
                    ],
                    onChange: (value) => {
                      setRoleFilter(value);
                      setPage(0);
                    },
                  },
                ]}
                sx={{ width: "100%", "& > *": { flex: 1 } }}
              />
            </CardContent>
          </Card>

          {/* Data Table */}
          <Fade in={!loading} timeout={500}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                "&:hover": {
                  boxShadow: theme.shadows[8],
                },
                transition: "box-shadow 0.3s ease",
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 8,
                  }}
                >
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <DataTable
                  columns={columns}
                  data={users}
                  total={total}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={(p) => setPage(p)}
                  onRowsPerPageChange={(r) => {
                    setRowsPerPage(r);
                    setPage(0);
                  }}
                  onDelete={handleDelete}
                  loading={loading}
                  emptyMessage="Không tìm thấy người dùng"
                />
              )}
            </Paper>
          </Fade>

          <ConfirmDialog
            open={confirmOpen}
            title={
              toBlock?.role === "blocked"
                ? "Mở chặn người dùng"
                : "Chặn người dùng"
            }
            message={
              toBlock
                ? `Bạn có muốn ${
                    toBlock.role === "blocked" ? "mở chặn" : "chặn"
                  } người dùng "${toBlock.email}" không?`
                : ""
            }
            onConfirm={confirmBlock}
            onCancel={() => setConfirmOpen(false)}
            severity="warning"
          />

          <ConfirmDialog
            open={confirmDeleteOpen}
            title="Xoá người dùng"
            message={
              toDelete
                ? `Bạn có chắc muốn xoá tài khoản "${toDelete.email}"?`
                : ""
            }
            onConfirm={confirmDelete}
            onCancel={() => setConfirmDeleteOpen(false)}
            severity="error"
          />

          {/* Role Change Dialog */}
          <Dialog
            open={roleChangeOpen}
            onClose={() => setRoleChangeOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Thay đổi vai trò người dùng</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Vai trò mới</InputLabel>
                <Select
                  value={newRole}
                  label="Vai trò mới"
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={
                    (selectedUser?.role === "admin" && adminCount <= 1) ||
                    (newRole === "admin" && adminCount >= 2)
                  }
                >
                  {availableRoles.map((role) => (
                    <MenuItem
                      key={role.value}
                      value={role.value}
                      disabled={
                        role.value === "admin" &&
                        adminCount >= 2 &&
                        selectedUser?.role !== "admin"
                      }
                    >
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedUser && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 2 }}
                >
                  Người dùng: {selectedUser.email}
                </Typography>
              )}
              {newRole === "admin" &&
                adminCount >= 2 &&
                selectedUser?.role !== "admin" && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Chỉ được phép có tối đa 2 tài khoản quản trị viên.
                  </Typography>
                )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRoleChangeOpen(false)}>Hủy</Button>
              <Button onClick={confirmRoleChange} variant="contained">
                Xác nhận
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminUsers;

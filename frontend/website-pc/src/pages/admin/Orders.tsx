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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import DataTable from "../../components/admin/common/DataTable";
import SearchBar from "../../components/admin/common/SearchBar";
import type { Column } from "../../components/admin/common/DataTable";
import type { Order } from "../../types/admin";
import { adminService } from "../../services/adminService";

type AdminOrder = Order & { customerName?: string };

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Order detail & status change
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Order["status"]>("pending");
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const firstNonEmpty = (...values: any[]) => {
    for (const v of values) {
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };

  const tryParseJson = (value: any) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  const buildFullName = (firstName?: any, lastName?: any) => {
    const first = typeof firstName === "string" ? firstName.trim() : "";
    const last = typeof lastName === "string" ? lastName.trim() : "";
    return `${first} ${last}`.trim();
  };

  const resolveCustomerNameFromUser = (user: any) => {
    const full = firstNonEmpty(
      user?.fullName,
      user?.full_name,
      buildFullName(user?.firstName, user?.lastName),
      buildFullName(user?.first_name, user?.last_name),
      user?.name,
      user?.username,
      user?.phone
    );
    return full || "";
  };

  const resolveCustomerEmailFromUser = (user: any) =>
    firstNonEmpty(user?.email, user?.userEmail, user?.user_email);

  const extractCustomerName = (raw: any) => {
    const shippingObj =
      raw?.shippingAddress && typeof raw.shippingAddress === "object"
        ? raw.shippingAddress
        : raw?.shipping_address && typeof raw.shipping_address === "object"
        ? raw.shipping_address
        : tryParseJson(raw?.shippingAddress ?? raw?.shipping_address);

    const nameFromShipping = shippingObj
      ? firstNonEmpty(
          shippingObj?.fullName,
          shippingObj?.name,
          buildFullName(shippingObj?.firstName, shippingObj?.lastName),
          buildFullName(shippingObj?.first_name, shippingObj?.last_name),
          shippingObj?.recipientName,
          shippingObj?.receiverName
        )
      : "";

    const nameFromUser = raw?.user ? resolveCustomerNameFromUser(raw.user) : "";

    // IMPORTANT: prefer real names; do not pick email unless no other choice
    const best = firstNonEmpty(
      raw?.customerName,
      raw?.customer_name,
      raw?.userName,
      raw?.user_name,
      nameFromUser,
      nameFromShipping
    );

    if (best) return best;
    const emailFallback = raw?.user
      ? resolveCustomerEmailFromUser(raw.user)
      : "";
    return emailFallback;
  };

  const normalizeOrderItem = (raw: any) => {
    const productId = String(
      raw?.productId ?? raw?.product_id ?? raw?.product?.id ?? raw?.id ?? ""
    );
    const productName = firstNonEmpty(
      raw?.productName,
      raw?.product_name,
      raw?.name,
      raw?.product?.name,
      raw?.product?.title,
      raw?.title
    );
    const image = firstNonEmpty(
      raw?.image,
      raw?.productImage,
      raw?.product_image,
      raw?.product?.image,
      Array.isArray(raw?.product?.images) ? raw.product.images[0] : ""
    );

    return {
      ...raw,
      productId,
      productName,
      image,
      quantity: Number(raw?.quantity ?? 0),
      price: Number(raw?.price ?? raw?.unitPrice ?? raw?.unit_price ?? 0),
    };
  };

  const enrichMissingProductNames = async (items: any[]) => {
    const missingIds = Array.from(
      new Set(
        items
          .filter((it) => !it?.productName && it?.productId)
          .map((it) => String(it.productId))
      )
    ).slice(0, 10);

    if (missingIds.length === 0) return items;

    const infoById = new Map<string, { name?: string; image?: string }>();

    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const res: any = await adminService.products.getById(id);
          const body: any = res?.data ?? res;
          const data: any = body?.data ?? body;
          infoById.set(id, {
            name: firstNonEmpty(data?.name, data?.productName),
            image: firstNonEmpty(
              data?.image,
              Array.isArray(data?.images) ? data.images[0] : ""
            ),
          });
        } catch {
          // ignore
        }
      })
    );

    return items.map((it) => {
      const info = infoById.get(String(it.productId));
      if (!info) return it;
      return {
        ...it,
        productName: it.productName || info.name || it.productName,
        image: it.image || info.image || it.image,
      };
    });
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
        return "Đang giao";
      case "delivered":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const normalizeOrder = (raw: any): AdminOrder => {
    const id = raw?.id ?? raw?._id ?? "";
    return {
      ...raw,
      id: String(id),
      userId: raw?.userId ?? raw?.user_id ?? "",
      customerName: extractCustomerName(raw),
      total: Number(raw?.total ?? 0),
      status: (raw?.status ?? "pending") as Order["status"],
      paymentStatus: (raw?.paymentStatus ??
        raw?.payment_status ??
        "pending") as "pending" | "paid" | "failed",
      shippingAddress: raw?.shippingAddress ?? raw?.shipping_address,
      paymentMethod: (raw?.paymentMethod ?? raw?.payment_method ?? "cod") as
        | "cod"
        | "banking"
        | "momo"
        | "vnpay",
      createdAt: raw?.createdAt ?? raw?.created_at,
      updatedAt: raw?.updatedAt ?? raw?.updated_at,
      items:
        raw?.items ??
        raw?.orderItems ??
        raw?.order_items ??
        raw?.order_items_enriched ??
        [],
      orderItems:
        raw?.orderItems ??
        raw?.items ??
        raw?.order_items ??
        raw?.order_items_enriched,
    } as Order;
  };

  const getOrderId = (o: any): string => String(o?.id ?? o?._id ?? "");

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.orders.getAll(params);
      const body: any = res?.data ?? res;
      const data = body?.data ?? body;

      const rawItems: any[] = Array.isArray(data)
        ? data
        : data?.data ?? data?.items ?? [];
      const items: Order[] = (rawItems || []).map(normalizeOrder);
      const totalCount: number =
        data?.total ?? data?.pagination?.total ?? body?.total ?? items.length;

      setOrders(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("Load orders failed", err);
      setOrders([]);
      setTotal(0);

      const anyErr: any = err;
      const message =
        anyErr?.response?.data?.message ||
        anyErr?.response?.data?.error ||
        anyErr?.message ||
        "Không thể tải danh sách đơn hàng";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    load();
  };

  const handleViewOrder = async (order: Order) => {
    const normalized = normalizeOrder(order);
    setSelectedOrder(normalized);
    setOrderItems(
      (normalized.items ?? normalized.orderItems ?? []).map(normalizeOrderItem)
    );
    setOrderDetailOpen(true);

    const id = getOrderId(normalized);
    if (!id || id === "undefined") return;

    try {
      setLoading(true);
      // Fetch full details (items often richer here)
      const detailRes: any = await adminService.orders.getById(id);
      const body: any = detailRes?.data ?? detailRes;
      const data: any = body?.data ?? body;
      const detailed = normalizeOrder(data);
      setSelectedOrder(detailed);

      const normalizedItems = (detailed.items ?? detailed.orderItems ?? []).map(
        normalizeOrderItem
      );
      setOrderItems(await enrichMissingProductNames(normalizedItems));

      // If backend doesn't include customer name, fetch user by id once
      if (!detailed.customerName && detailed.userId) {
        try {
          const user: any = await adminService.users.getById(
            String(detailed.userId)
          );
          const displayName = resolveCustomerNameFromUser(user);
          const email = resolveCustomerEmailFromUser(user);
          const nameToShow = displayName || email;
          if (nameToShow) {
            setSelectedOrder((prev) =>
              prev
                ? ({ ...prev, customerName: nameToShow } as AdminOrder)
                : prev
            );
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Load order detail failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = (order: Order) => {
    const normalized = normalizeOrder(order);
    setSelectedOrder(normalized);
    setNewStatus(normalized.status || "pending");
    setStatusChangeOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      const id = getOrderId(selectedOrder);
      if (!id || id === "undefined") {
        toast.error("Không tìm thấy mã đơn hàng để cập nhật");
        return;
      }

      await adminService.orders.updateStatus(id, newStatus);
      setStatusChangeOpen(false);
      load();
    } catch (err) {
      console.error("Update status failed", err);
      const anyErr: any = err;
      const message =
        anyErr?.response?.data?.message ||
        anyErr?.response?.data?.error ||
        anyErr?.message ||
        "Cập nhật trạng thái thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter]);

  const columns: Column[] = [
    { id: "id", label: "Mã đơn", minWidth: 150 },
    {
      id: "userId",
      label: "Khách hàng",
      minWidth: 180,
      format: (_: any, row: any) => row?.customerName || row?.userId,
    },
    {
      id: "total",
      label: "Tổng tiền",
      minWidth: 120,
      format: (value: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value),
    },
    {
      id: "status",
      label: "Trạng thái",
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={getStatusLabel(value)}
          color={getStatusColor(value) as any}
          size="small"
        />
      ),
    },
    {
      id: "createdAt",
      label: "Ngày đặt",
      minWidth: 150,
      format: (value: any) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      id: "actions",
      label: "Thao tác",
      minWidth: 150,
      align: "center" as const,
      format: (_: any, row: Order) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewOrder(row)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thay đổi trạng thái">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleChangeStatus(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="In hóa đơn">
            <IconButton
              size="small"
              color="default"
              onClick={() => {
                handleViewOrder(row);
                setTimeout(handlePrintInvoice, 500);
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Quản lý đơn hàng
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => load()}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Stack>

      {/* Search & Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="Tìm kiếm mã đơn hàng..."
            filters={[
              {
                label: "Trạng thái",
                value: statusFilter,
                options: [
                  { value: "", label: "Tất cả" },
                  { value: "pending", label: "Chờ xử lý" },
                  { value: "completed", label: "Hoàn thành" },
                  { value: "cancelled", label: "Đã hủy" },
                  { value: "shipped", label: "Đã gửi" },
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
        data={orders}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        loading={loading}
        emptyMessage="Không tìm thấy đơn hàng"
      />

      {/* Order Detail Dialog */}
      <Dialog
        open={orderDetailOpen}
        onClose={() => setOrderDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin đơn hàng
                </Typography>
                <Typography>
                  <strong>Mã đơn:</strong> {selectedOrder.id}
                </Typography>
                <Typography>
                  <strong>Khách hàng:</strong>{" "}
                  {selectedOrder.customerName || selectedOrder.userId}
                </Typography>
                <Typography>
                  <strong>Địa chỉ giao hàng:</strong>{" "}
                  {selectedOrder.shippingAddress}
                </Typography>
                <Typography>
                  <strong>Phương thức thanh toán:</strong>{" "}
                  {selectedOrder.paymentMethod === "cod"
                    ? "Thanh toán khi nhận hàng"
                    : selectedOrder.paymentMethod === "banking"
                    ? "Chuyển khoản ngân hàng"
                    : selectedOrder.paymentMethod === "momo"
                    ? "Ví MoMo"
                    : selectedOrder.paymentMethod === "vnpay"
                    ? "VNPay"
                    : selectedOrder.paymentMethod}
                </Typography>
                <Typography>
                  <strong>Trạng thái thanh toán:</strong>{" "}
                  {selectedOrder.paymentStatus === "paid"
                    ? "Đã thanh toán"
                    : selectedOrder.paymentStatus === "pending"
                    ? "Chờ thanh toán"
                    : selectedOrder.paymentStatus === "failed"
                    ? "Thất bại"
                    : selectedOrder.paymentStatus}
                </Typography>
                <Typography>
                  <strong>Trạng thái:</strong>{" "}
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    color={getStatusColor(selectedOrder.status) as any}
                    size="small"
                  />
                </Typography>
                <Typography>
                  <strong>Ngày đặt:</strong>{" "}
                  {new Date(selectedOrder.createdAt || "").toLocaleString(
                    "vi-VN"
                  )}
                </Typography>
                <Typography>
                  <strong>Tổng tiền:</strong>{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(selectedOrder.total)}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Sản phẩm
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              component="img"
                              src={item.image}
                              alt={item.productName || item.productId}
                              sx={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 1,
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                            {item.productName || item.productId}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price)}
                        </TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintInvoice} startIcon={<PrintIcon />}>
            In hóa đơn
          </Button>
          <Button onClick={() => setOrderDetailOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusChangeOpen}
        onClose={() => setStatusChangeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thay đổi trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Trạng thái mới</InputLabel>
            <Select
              value={newStatus}
              label="Trạng thái mới"
              onChange={(e) => setNewStatus(e.target.value as Order["status"])}
            >
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="confirmed">Đã xác nhận</MenuItem>
              <MenuItem value="shipped">Đang giao</MenuItem>
              <MenuItem value="delivered">Hoàn tất</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeOpen(false)}>Hủy</Button>
          <Button onClick={confirmStatusChange} variant="contained">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrders;

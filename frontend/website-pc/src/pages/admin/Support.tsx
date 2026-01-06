import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
  ListItem,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  List,
  TextareaAutosize,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Assignment as TicketIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  PriorityHigh as PriorityHighIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { Alert } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { adminService } from "../../services/adminService";

interface SupportTicket {
  id: string;
  title: string;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "resolved" | "closed";
  lastMessage: {
    text: string;
    sender: "customer" | "support";
    timestamp: Date;
  };
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    text: string;
    sender: "customer" | "support";
    timestamp: Date;
    read: boolean;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `support-tab-${index}`,
    "aria-controls": `support-tabpanel-${index}`,
  };
}

const Support: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseDate = (dateString: string | Date | undefined): Date => {
    if (!dateString) return new Date();
    try {
      return dateString instanceof Date ? dateString : new Date(dateString);
    } catch (e) {
      console.error("Invalid date:", dateString, e);
      return new Date();
    }
  };

  // Fetch support messages from API
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try to fetch from API
        const response = await adminService.support.getMessages({
          status:
            tabValue === 0
              ? undefined
              : tabValue === 1
              ? "open"
              : tabValue === 2
              ? "pending"
              : tabValue === 3
              ? "resolved"
              : "closed",
        });

        const data = response.data?.data || response.data || [];

        if (Array.isArray(data) && data.length > 0) {
          const mappedTickets = data.map((item: any) => {
            const ticketId = item.id || `TICKET-${Date.now()}`;
            const customerId = item.userId || item.customerId || "unknown";
            const customerName =
              item.customerName || item.userName || "Khách hàng";
            const customerEmail =
              item.email || item.customerEmail || "no-email@example.com";
            const avatar =
              item.avatar || `https://i.pravatar.cc/150?u=${customerId}`;

            const messages = (item.messages || []).map((msg: any) => ({
              id:
                msg.id ||
                `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: msg.text || msg.content || "",
              sender: msg.sender === "support" ? "support" : "customer",
              timestamp: parseDate(msg.timestamp),
              read: msg.read !== false,
            }));

            const lastMessage =
              item.lastMessage ||
              item.messages?.[item.messages?.length - 1] ||
              {};

            return {
              id: ticketId,
              title:
                item.title || `Yêu cầu hỗ trợ #${ticketId.substring(0, 6)}`,
              customer: {
                id: customerId,
                name: customerName,
                email: customerEmail,
                avatar: avatar,
              },
              category: item.category || "Khác",
              priority: (["low", "medium", "high", "urgent"].includes(
                item.priority
              )
                ? item.priority
                : "medium") as SupportTicket["priority"],
              status: (["open", "pending", "resolved", "closed"].includes(
                item.status
              )
                ? item.status
                : "open") as SupportTicket["status"],
              lastMessage: {
                text: lastMessage.text || item.message || "Không có tin nhắn",
                sender: (lastMessage.sender === "support" ||
                item.sender === "support"
                  ? "support"
                  : "customer") as "customer" | "support",
                timestamp: parseDate(
                  lastMessage.timestamp || item.updatedAt || item.createdAt
                ),
              },
              unreadCount:
                typeof item.unreadCount === "number" ? item.unreadCount : 0,
              createdAt: parseDate(item.createdAt),
              updatedAt: parseDate(item.updatedAt || item.createdAt),
              messages: messages,
            };
          });

          setTickets(mappedTickets);
        } else {
          // Fallback to empty array if no data
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching support messages:", error);
        setError(
          "Không thể tải danh sách yêu cầu hỗ trợ. Vui lòng thử lại sau."
        );
        // Fallback to empty array to prevent crashes
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [tabValue]); // Refetch when tab changes

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setOpenDialog(true);
    // Mark messages as read when opening the ticket
    if (ticket.unreadCount > 0) {
      setTickets((prevTickets) =>
        prevTickets.map((t) =>
          t.id === ticket.id ? { ...t, unreadCount: 0 } : t
        )
      );
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setLoading(true);
      await adminService.support.replyMessage(selectedTicket.id, replyText);

      const newMessage = {
        id: `msg-${Date.now()}`,
        text: replyText,
        sender: "support" as const,
        timestamp: new Date(),
        read: true,
      };

      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === selectedTicket.id
            ? {
                ...ticket,
                lastMessage: {
                  text: newMessage.text,
                  sender: newMessage.sender,
                  timestamp: newMessage.timestamp,
                },
                updatedAt: new Date(),
                messages: [...ticket.messages, newMessage],
              }
            : ticket
        )
      );

      setSelectedTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lastMessage: {
            text: newMessage.text,
            sender: newMessage.sender,
            timestamp: newMessage.timestamp,
          },
          updatedAt: new Date(),
          messages: [...prev.messages, newMessage],
        };
      });

      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
      setError("Không thể gửi phản hồi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    ticketId: string,
    status: SupportTicket["status"]
  ) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status,
        updatedAt: new Date(),
      });
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Filter by search term
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by tab
    let matchesTab = true;
    if (tabValue === 1)
      matchesTab = ticket.status === "open" || ticket.status === "pending";
    else if (tabValue === 2) matchesTab = ticket.status === "resolved";
    else if (tabValue === 3) matchesTab = ticket.status === "closed";

    return matchesSearch && matchesTab;
  });

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "low":
        return "info";
      case "medium":
        return "success";
      case "high":
        return "warning";
      case "urgent":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "primary";
      case "pending":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityIcon = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "low":
        return <InfoIcon color="info" fontSize="small" />;
      case "medium":
        return <InfoIcon color="success" fontSize="small" />;
      case "high":
        return <PriorityHighIcon color="warning" fontSize="small" />;
      case "urgent":
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ChatIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h5" component="h1">
            Hỗ trợ khách hàng
          </Typography>
          {/* ... rest of your code ... */}
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={async () => {
              setLoading(true);
              try {
                const response = await adminService.support.getMessages();
                const data = response.data?.data || response.data || [];
                const mappedTickets: SupportTicket[] = (
                  Array.isArray(data) ? data : []
                ).map((item: any, index: number) => {
                  const statuses: Array<SupportTicket["status"]> = [
                    "open",
                    "pending",
                    "resolved",
                    "closed",
                  ];
                  const priorities: Array<SupportTicket["priority"]> = [
                    "low",
                    "medium",
                    "high",
                    "urgent",
                  ];

                  return {
                    id: item.id || `TICKET-${index}`,
                    title:
                      item.title ||
                      item.subject ||
                      `Yêu cầu hỗ trợ #${index + 1}`,
                    customer: {
                      id: item.userId || item.customerId || `CUST-${index}`,
                      name:
                        item.customerName ||
                        item.userName ||
                        `Khách hàng ${index + 1}`,
                      email:
                        item.email ||
                        item.customerEmail ||
                        `customer${index}@example.com`,
                      avatar:
                        item.avatar ||
                        `https://i.pravatar.cc/150?u=${item.userId || index}`,
                    },
                    category: item.category || "Khác",
                    priority:
                      item.priority || priorities[index % priorities.length],
                    status: item.status || statuses[index % statuses.length],
                    lastMessage: {
                      text:
                        item.message ||
                        item.content ||
                        item.text ||
                        "Không có tin nhắn",
                      sender:
                        item.sender === "support" ? "support" : "customer",
                      timestamp: item.createdAt
                        ? new Date(item.createdAt)
                        : new Date(),
                    },
                    unreadCount: item.unreadCount || 0,
                    createdAt: item.createdAt
                      ? new Date(item.createdAt)
                      : new Date(),
                    updatedAt: item.updatedAt
                      ? new Date(item.updatedAt)
                      : new Date(),
                    messages: item.messages || [
                      {
                        id: `msg-${index}-1`,
                        text:
                          item.message ||
                          item.content ||
                          item.text ||
                          "Không có tin nhắn",
                        sender:
                          item.sender === "support" ? "support" : "customer",
                        timestamp: item.createdAt
                          ? new Date(item.createdAt)
                          : new Date(),
                        read: true,
                      },
                    ],
                  };
                });
                setTickets(mappedTickets);
              } catch (error) {
                console.error("Error refreshing support messages:", error);
              } finally {
                setLoading(false);
              }
            }}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="support tabs"
          >
            <Tab label="Tất cả" {...a11yProps(0)} />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <span>Đang mở</span>
                  <Chip
                    label={
                      tickets.filter(
                        (t) => t.status === "open" || t.status === "pending"
                      ).length
                    }
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, "& .MuiChip-label": { px: 1 } }}
                  />
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab label="Đã giải quyết" {...a11yProps(2)} />
            <Tab label="Đã đóng" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm yêu cầu hỗ trợ..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, maxWidth: 500 }}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã yêu cầu</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Danh mục</TableCell>
                  <TableCell>Độ ưu tiên</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Cập nhật lần cuối</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      Không có yêu cầu hỗ trợ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        hover
                        onClick={() => handleOpenTicket(ticket)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <TicketIcon
                              color="action"
                              fontSize="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {ticket.id}
                            </Typography>
                            {ticket.unreadCount > 0 && (
                              <Chip
                                label={ticket.unreadCount}
                                size="small"
                                color="primary"
                                sx={{
                                  ml: 1,
                                  height: 20,
                                  "& .MuiChip-label": { px: 0.5 },
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              src={ticket.customer.avatar}
                              alt={ticket.customer.name}
                              sx={{ width: 32, height: 32, mr: 1 }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {ticket.customer.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {ticket.customer.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 300 }}
                          >
                            {ticket.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            noWrap
                          >
                            {ticket.lastMessage.text.substring(0, 60)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {getPriorityIcon(ticket.priority)}
                            <Typography
                              variant="body2"
                              sx={{ ml: 0.5, textTransform: "capitalize" }}
                            >
                              {ticket.priority === "high"
                                ? "Cao"
                                : ticket.priority === "medium"
                                ? "Trung bình"
                                : ticket.priority === "low"
                                ? "Thấp"
                                : "Khẩn cấp"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              ticket.status === "open"
                                ? "Mở"
                                : ticket.status === "pending"
                                ? "Đang xử lý"
                                : ticket.status === "resolved"
                                ? "Đã giải quyết"
                                : "Đã đóng"
                            }
                            color={getStatusColor(ticket.status) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatRelativeTime(ticket.updatedAt)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(ticket.updatedAt).toLocaleString("vi-VN")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" color="primary">
                              <ChatIcon fontSize="small" />
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
            count={filteredTickets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} trong tổng ${count}`
            }
          />
        </Box>
      </Paper>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={openDialog && !!selectedTicket}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 900}
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TicketIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" component="div">
                    {selectedTicket.title}
                  </Typography>
                </Box>
                <Box>
                  <FormControl size="small" sx={{ minWidth: 150, mr: 1 }}>
                    <InputLabel id="ticket-status-label">Trạng thái</InputLabel>
                    <Select
                      labelId="ticket-status-label"
                      value={selectedTicket.status}
                      label="Trạng thái"
                      onChange={(e) =>
                        handleStatusChange(
                          selectedTicket.id,
                          e.target.value as any
                        )
                      }
                      size="small"
                    >
                      <MenuItem value="open">Mở</MenuItem>
                      <MenuItem value="pending">Đang xử lý</MenuItem>
                      <MenuItem value="resolved">Đã giải quyết</MenuItem>
                      <MenuItem value="closed">Đã đóng</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={handleCloseDialog}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ display: "flex", alignItems: "center", mr: 2 }}
                >
                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {selectedTicket.customer.name} (
                  {selectedTicket.customer.email})
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ display: "flex", alignItems: "center", mr: 2 }}
                >
                  <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Tạo {formatRelativeTime(selectedTicket.createdAt)}
                </Typography>
                <Chip
                  label={
                    selectedTicket.priority === "high"
                      ? "Ưu tiên cao"
                      : selectedTicket.priority === "medium"
                      ? "Ưu tiên trung bình"
                      : selectedTicket.priority === "low"
                      ? "Ưu tiên thấp"
                      : "Khẩn cấp"
                  }
                  color={getPriorityColor(selectedTicket.priority) as any}
                  size="small"
                  icon={getPriorityIcon(selectedTicket.priority)}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, bgcolor: "#f9f9f9" }}>
              <Box sx={{ p: 2, maxHeight: "60vh", overflowY: "auto" }}>
                <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                  {selectedTicket.messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          flexDirection:
                            message.sender === "customer"
                              ? "row"
                              : "row-reverse",
                          textAlign:
                            message.sender === "customer" ? "left" : "right",
                          pl: message.sender === "customer" ? 0 : 8,
                          pr: message.sender === "customer" ? 8 : 0,
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          {message.sender === "customer" ? (
                            <Avatar
                              alt={selectedTicket.customer.name}
                              src={selectedTicket.customer.avatar}
                              sx={{ width: 32, height: 32 }}
                            >
                              <PersonIcon />
                            </Avatar>
                          ) : (
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                          )}
                        </ListItemAvatar>
                        <Box
                          sx={{
                            maxWidth: "70%",
                            p: 2,
                            borderRadius: 2,
                            bgcolor:
                              message.sender === "customer"
                                ? "background.paper"
                                : "primary.light",
                            color:
                              message.sender === "customer"
                                ? "text.primary"
                                : "primary.contrastText",
                            boxShadow: 1,
                            position: "relative",
                            "&:after": {
                              content: '""',
                              position: "absolute",
                              width: 0,
                              height: 0,
                              borderStyle: "solid",
                              borderWidth: "8px 10px 8px 0",
                              borderColor: `transparent ${
                                message.sender === "customer"
                                  ? "#fff"
                                  : "primary.light"
                              } transparent transparent`,
                              left: message.sender === "customer" ? -8 : "auto",
                              right:
                                message.sender === "customer" ? "auto" : -8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              display:
                                message.sender === "customer"
                                  ? "block"
                                  : "none",
                            },
                            "&:before": {
                              content: '""',
                              position: "absolute",
                              width: 0,
                              height: 0,
                              borderStyle: "solid",
                              borderWidth: "8px 0 8px 10px",
                              borderColor: `transparent transparent transparent ${
                                message.sender === "customer"
                                  ? "rgba(0,0,0,0.1)"
                                  : "primary.dark"
                              }`,
                              left: message.sender === "customer" ? "auto" : -8,
                              right:
                                message.sender === "customer" ? -8 : "auto",
                              top: "50%",
                              transform: "translateY(-50%)",
                              display:
                                message.sender === "customer"
                                  ? "none"
                                  : "block",
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {message.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "right",
                              mt: 0.5,
                              color:
                                message.sender === "customer"
                                  ? "text.secondary"
                                  : "primary.contrastText",
                              opacity: 0.8,
                            }}
                          >
                            {formatRelativeTime(message.timestamp)}
                            {message.sender === "support" && message.read && (
                              <CheckIcon
                                fontSize="inherit"
                                sx={{ ml: 0.5, fontSize: "0.8rem" }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < selectedTicket.messages.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                <TextareaAutosize
                  minRows={2}
                  maxRows={6}
                  placeholder="Nhập nội dung phản hồi..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    minHeight: "60px",
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  sx={{ ml: 1, height: "56px", minWidth: "100px" }}
                  startIcon={<SendIcon />}
                >
                  Gửi
                </Button>
              </Box>
              <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  onClick={() => {
                    handleStatusChange(selectedTicket.id, "resolved");
                    setReplyText(
                      (prev) =>
                        prev ||
                        "Vấn đề đã được giải quyết. Cảm ơn bạn đã liên hệ!"
                    );
                  }}
                  startIcon={<CheckCircleIcon />}
                  sx={{ mr: 1 }}
                >
                  Đánh dấu đã giải quyết
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    handleStatusChange(selectedTicket.id, "closed")
                  }
                  startIcon={<CancelIcon />}
                  color="error"
                >
                  Đóng yêu cầu
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Support;

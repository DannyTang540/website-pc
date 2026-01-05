import React from "react";
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
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  lastUpdated: string;
}

const Inventory: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch inventory from mock data
  React.useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // Mock inventory data
        const mockInventory: InventoryItem[] = [
          {
            id: "inv-001",
            productName: "PC Gaming RTX 4090",
            sku: "PC-4090-001",
            category: "PC Gaming",
            quantity: 8,
            price: 59900000,
            status: "low_stock",
            lastUpdated: "2024-12-22",
          },
          {
            id: "inv-002",
            productName: "PC Gaming RTX 4080",
            sku: "PC-4080-001",
            category: "PC Gaming",
            quantity: 15,
            price: 35900000,
            status: "in_stock",
            lastUpdated: "2024-12-21",
          },
          {
            id: "inv-003",
            productName: "PC Gaming RTX 4070",
            sku: "PC-4070-001",
            category: "PC Gaming",
            quantity: 22,
            price: 28500000,
            status: "in_stock",
            lastUpdated: "2024-12-20",
          },
          {
            id: "inv-004",
            productName: "PC Gaming RTX 4060 Ti",
            sku: "PC-4060TI-001",
            category: "PC Gaming",
            quantity: 3,
            price: 24500000,
            status: "low_stock",
            lastUpdated: "2024-12-22",
          },
          {
            id: "inv-005",
            productName: "PC Gaming RTX 4060",
            sku: "PC-4060-001",
            category: "PC Gaming",
            quantity: 18,
            price: 12900000,
            status: "in_stock",
            lastUpdated: "2024-12-19",
          },
          {
            id: "inv-006",
            productName: "PC Gaming Ryzen 7 + RTX 4070",
            sku: "PC-R7-4070-001",
            category: "PC Gaming",
            quantity: 12,
            price: 32500000,
            status: "in_stock",
            lastUpdated: "2024-12-18",
          },
          {
            id: "inv-007",
            productName: "Laptop Gaming Acer Nitro 5",
            sku: "LP-ACER-001",
            category: "Laptop Gaming",
            quantity: 25,
            price: 18900000,
            status: "in_stock",
            lastUpdated: "2024-12-22",
          },
          {
            id: "inv-008",
            productName: "Laptop Gaming ASUS ROG",
            sku: "LP-ASUS-001",
            category: "Laptop Gaming",
            quantity: 10,
            price: 28900000,
            status: "in_stock",
            lastUpdated: "2024-12-21",
          },
          {
            id: "inv-009",
            productName: "Màn hình Samsung 27inch 144Hz",
            sku: "MON-SAM-001",
            category: "Màn hình",
            quantity: 35,
            price: 10000000,
            status: "in_stock",
            lastUpdated: "2024-12-20",
          },
          {
            id: "inv-010",
            productName: "Màn hình LG 32inch 165Hz",
            sku: "MON-LG-001",
            category: "Màn hình",
            quantity: 0,
            price: 15900000,
            status: "out_of_stock",
            lastUpdated: "2024-12-22",
          },
          {
            id: "inv-011",
            productName: "Gaming Chair DXRacer",
            sku: "CHR-DXR-001",
            category: "Ghế Gaming",
            quantity: 4,
            price: 4450000,
            status: "low_stock",
            lastUpdated: "2024-12-21",
          },
          {
            id: "inv-012",
            productName: "Bàn Gaming LED RGB",
            sku: "DESK-LED-001",
            category: "Bàn Gaming",
            quantity: 16,
            price: 8000000,
            status: "in_stock",
            lastUpdated: "2024-12-19",
          },
          {
            id: "inv-013",
            productName: "Bàn phím cơ Gaming",
            sku: "KB-MECH-001",
            category: "Phím Gaming",
            quantity: 28,
            price: 2200000,
            status: "in_stock",
            lastUpdated: "2024-12-18",
          },
          {
            id: "inv-014",
            productName: "Chuột Gaming Logitech",
            sku: "MOUSE-LOG-001",
            category: "Chuột Gaming",
            quantity: 2,
            price: 1500000,
            status: "low_stock",
            lastUpdated: "2024-12-22",
          },
          {
            id: "inv-015",
            productName: "Tai nghe Gaming Razer",
            sku: "HEAD-RZR-001",
            category: "Tai nghe",
            quantity: 0,
            price: 3200000,
            status: "out_of_stock",
            lastUpdated: "2024-12-21",
          },
        ];

        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setInventory(mockInventory);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
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

  const filteredInventory = inventory.filter((item) =>
    Object.values(item).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Chip label="Còn hàng" color="success" size="small" />;
      case "low_stock":
        return <Chip label="Sắp hết" color="warning" size="small" />;
      case "out_of_stock":
        return <Chip label="Hết hàng" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
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
          <InventoryIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h5" component="h1">
            Quản lý kho hàng
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => console.log("Add new item")}
            sx={{ mr: 1 }}
          >
            Thêm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={async () => {
              setLoading(true);
              try {
                // Mock refresh data
                const mockInventory: InventoryItem[] = [
                  {
                    id: "inv-001",
                    productName: "PC Gaming RTX 4090",
                    sku: "PC-4090-001",
                    category: "PC Gaming",
                    quantity: 8,
                    price: 59900000,
                    status: "low_stock",
                    lastUpdated: "2024-12-22",
                  },
                  {
                    id: "inv-002",
                    productName: "PC Gaming RTX 4080",
                    sku: "PC-4080-001",
                    category: "PC Gaming",
                    quantity: 15,
                    price: 35900000,
                    status: "in_stock",
                    lastUpdated: "2024-12-21",
                  },
                  {
                    id: "inv-003",
                    productName: "PC Gaming RTX 4070",
                    sku: "PC-4070-001",
                    category: "PC Gaming",
                    quantity: 22,
                    price: 28500000,
                    status: "in_stock",
                    lastUpdated: "2024-12-20",
                  },
                  {
                    id: "inv-004",
                    productName: "PC Gaming RTX 4060 Ti",
                    sku: "PC-4060TI-001",
                    category: "PC Gaming",
                    quantity: 3,
                    price: 24500000,
                    status: "low_stock",
                    lastUpdated: "2024-12-22",
                  },
                  {
                    id: "inv-005",
                    productName: "PC Gaming RTX 4060",
                    sku: "PC-4060-001",
                    category: "PC Gaming",
                    quantity: 18,
                    price: 12900000,
                    status: "in_stock",
                    lastUpdated: "2024-12-19",
                  },
                  {
                    id: "inv-006",
                    productName: "PC Gaming Ryzen 7 + RTX 4070",
                    sku: "PC-R7-4070-001",
                    category: "PC Gaming",
                    quantity: 12,
                    price: 32500000,
                    status: "in_stock",
                    lastUpdated: "2024-12-18",
                  },
                  {
                    id: "inv-007",
                    productName: "Laptop Gaming Acer Nitro 5",
                    sku: "LP-ACER-001",
                    category: "Laptop Gaming",
                    quantity: 25,
                    price: 18900000,
                    status: "in_stock",
                    lastUpdated: "2024-12-22",
                  },
                  {
                    id: "inv-008",
                    productName: "Laptop Gaming ASUS ROG",
                    sku: "LP-ASUS-001",
                    category: "Laptop Gaming",
                    quantity: 10,
                    price: 28900000,
                    status: "in_stock",
                    lastUpdated: "2024-12-21",
                  },
                  {
                    id: "inv-009",
                    productName: "Màn hình Samsung 27inch 144Hz",
                    sku: "MON-SAM-001",
                    category: "Màn hình",
                    quantity: 35,
                    price: 10000000,
                    status: "in_stock",
                    lastUpdated: "2024-12-20",
                  },
                  {
                    id: "inv-010",
                    productName: "Màn hình LG 32inch 165Hz",
                    sku: "MON-LG-001",
                    category: "Màn hình",
                    quantity: 0,
                    price: 15900000,
                    status: "out_of_stock",
                    lastUpdated: "2024-12-22",
                  },
                  {
                    id: "inv-011",
                    productName: "Gaming Chair DXRacer",
                    sku: "CHR-DXR-001",
                    category: "Ghế Gaming",
                    quantity: 4,
                    price: 4450000,
                    status: "low_stock",
                    lastUpdated: "2024-12-21",
                  },
                  {
                    id: "inv-012",
                    productName: "Bàn Gaming LED RGB",
                    sku: "DESK-LED-001",
                    category: "Bàn Gaming",
                    quantity: 16,
                    price: 8000000,
                    status: "in_stock",
                    lastUpdated: "2024-12-19",
                  },
                  {
                    id: "inv-013",
                    productName: "Bàn phím cơ Gaming",
                    sku: "KB-MECH-001",
                    category: "Phím Gaming",
                    quantity: 28,
                    price: 2200000,
                    status: "in_stock",
                    lastUpdated: "2024-12-18",
                  },
                  {
                    id: "inv-014",
                    productName: "Chuột Gaming Logitech",
                    sku: "MOUSE-LOG-001",
                    category: "Chuột Gaming",
                    quantity: 2,
                    price: 1500000,
                    status: "low_stock",
                    lastUpdated: "2024-12-22",
                  },
                  {
                    id: "inv-015",
                    productName: "Tai nghe Gaming Razer",
                    sku: "HEAD-RZR-001",
                    category: "Tai nghe",
                    quantity: 0,
                    price: 3200000,
                    status: "out_of_stock",
                    lastUpdated: "2024-12-21",
                  },
                ];

                // Simulate loading delay
                await new Promise((resolve) => setTimeout(resolve, 1000));

                setInventory(mockInventory);
              } catch (error) {
                console.error("Error refreshing inventory:", error);
              } finally {
                setLoading(false);
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
          placeholder="Tìm kiếm sản phẩm..."
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
                <TableCell>Mã sản phẩm</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Giá bán</TableCell>
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
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell>{item.lastUpdated}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => console.log("Edit", item.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => console.log("Delete", item.id)}
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
          count={filteredInventory.length}
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
    </Box>
  );
};

export default Inventory;

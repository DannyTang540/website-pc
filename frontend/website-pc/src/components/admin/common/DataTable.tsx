import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

export interface Column<T = any> {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "Không có dữ liệu",
}) => {
  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  const renderCell = (row: any, column: Column) => {
    const value = row[column.id];

    if (column.format) {
      return column.format(value, row);
    }

    // Default formatting for common data types
    switch (column.id) {
      case "price":
      case "originalPrice":
      case "totalAmount":
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value);

      case "status":
        return (
          <Chip
            label={
              value === "active"
                ? "Hoạt động"
                : value === "inactive"
                ? "Ẩn"
                : value === "pending"
                ? "Chờ xử lý"
                : value === "completed"
                ? "Hoàn thành"
                : value === "cancelled"
                ? "Đã hủy"
                : value
            }
            color={
              value === "active" || value === "completed"
                ? "success"
                : value === "pending"
                ? "warning"
                : value === "cancelled"
                ? "error"
                : "default"
            }
            size="small"
          />
        );

      case "stock":
        let stockColor: "default" | "warning" | "error" = "default";
        if (value === 0) stockColor = "error";
        else if (value <= (row.minimumStock || 5)) stockColor = "warning";

        return <Chip label={value} color={stockColor} size="small" />;

      default:
        return value;
    }
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: "bold" }}
                >
                  {column.sortable ? (
                    <TableSortLabel>{column.label}</TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell
                  align="center"
                  style={{ minWidth: 120, fontWeight: "bold" }}
                >
                  Thao tác
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography>Đang tải...</Typography>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography color="textSecondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id || index}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        {onView && (
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => onView(row)}
                          >
                            <ViewIcon />
                          </IconButton>
                        )}
                        {onEdit && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit(row)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(row)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số hàng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} trong số ${count !== -1 ? count : `nhiều hơn ${to}`}`
        }
      />
    </Paper>
  );
};

export default DataTable;

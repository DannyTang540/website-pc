import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import type { Banner } from "../../types/banner";

interface BannerListProps {
  banners: Banner[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEditBanner: (banner: Banner) => void;
  onDeleteBanner: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const BannerList: React.FC<BannerListProps> = ({
  banners,
  loading,
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
  onEditBanner,
  onDeleteBanner,
  onToggleStatus,
}) => {
  return (
    <Paper sx={{ width: "100%", overflow: "hidden", mt: 2 }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Vị trí</TableCell>
              <TableCell>Ngày bắt đầu</TableCell>
              <TableCell>Ngày kết thúc</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <Box
                      component="img"
                      src={banner.image}
                      alt={banner.title}
                      sx={{
                        width: 100,
                        height: "auto",
                        borderRadius: 1,
                        objectFit: "cover",
                      }}
                    />
                  </TableCell>
                  <TableCell>{banner.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={banner.type}
                      color={
                        banner.type === "image"
                          ? "primary"
                          : banner.type === "video"
                          ? "secondary"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={banner.position}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(banner.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(banner.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={banner.isActive}
                          onChange={(e) =>
                            onToggleStatus(banner.id, e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={banner.isActive ? "Đang hoạt động" : "Đã tắt"}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => onEditBanner(banner)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteBanner(banner.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                    {banner.targetUrl && (
                      <IconButton
                        href={banner.targetUrl}
                        target="_blank"
                        size="small"
                        color="info"
                      >
                        <LinkIcon />
                      </IconButton>
                    )}
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
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Số hàng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} trong ${count}`
        }
      />
    </Paper>
  );
};

export default BannerList;

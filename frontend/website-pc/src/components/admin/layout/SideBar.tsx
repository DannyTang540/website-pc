import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Computer as ComputerIcon,
  ShoppingCart as OrderIcon,
  People as UserIcon,
  Inventory as InventoryIcon,
  LocalOffer as PromotionIcon,
  Support as SupportIcon,
  Campaign as BannerIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Build as SpecsIcon,
  FilterList as FilterIcon,
  AttachMoney as RevenueIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { text: "Bảng điều khiển", icon: <DashboardIcon />, path: "/admin" },
  { text: "Danh mục", icon: <CategoryIcon />, path: "/admin/categories" },
  { text: "Sản phẩm", icon: <ComputerIcon />, path: "/admin/products" },
  {
    text: "Thông số kỹ thuật",
    icon: <SpecsIcon />,
    path: "/admin/specifications",
  },
  { text: "Đơn hàng", icon: <OrderIcon />, path: "/admin/orders" },
  { text: "Doanh thu", icon: <RevenueIcon />, path: "/admin/revenue" },
  { text: "Người dùng", icon: <UserIcon />, path: "/admin/users" },
  // { text: "Kho hàng", icon: <InventoryIcon />, path: "/admin/inventory" },
  // { text: "Khuyến mãi", icon: <PromotionIcon />, path: "/admin/promotions" },
  // {
  //   text: "Tiêu chí lọc",
  //   icon: <FilterIcon />,
  //   path: "/admin/filter-criteria",
  // },
  { text: "Hỗ trợ", icon: <SupportIcon />, path: "/admin/support" },
  { text: "Banner", icon: <BannerIcon />, path: "/admin/banners" },
  { text: "Cài đặt", icon: <SettingsIcon />, path: "/admin/settings" },
];

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const drawer = (
    <div>
      <Toolbar
        sx={{
          bgcolor: "#1976D2",
          color: "white",
          background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
        }}
      >
        <Box display="flex" alignItems="center" width="100%">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              bgcolor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1.5,
            }}
          >
            <ComputerIcon sx={{ fontSize: 24, color: "white" }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: "bold",
                lineHeight: 1.2,
                fontSize: "16px",
              }}
            >
              PC Store
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                lineHeight: 1,
                display: "block",
              }}
            >
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />

      {/* Link về trang chủ */}
      <List sx={{ p: 0 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate("/")}
            sx={{
              "&:hover": {
                bgcolor: "#F5F5F5",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#1976D2" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText
              primary="Về trang chủ"
              primaryTypographyProps={{ fontSize: "14px" }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />

      {/* Menu chính */}
      <List sx={{ p: 0 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderLeft: isSelected ? "4px solid #1976D2" : "none",
                  bgcolor: isSelected ? "#E3F2FD" : "transparent",
                  color: isSelected ? "#1976D2" : "inherit",
                  "&:hover": {
                    bgcolor: isSelected ? "#E3F2FD" : "#F5F5F5",
                  },
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    bgcolor: "#E3F2FD",
                    color: "#1976D2",
                    "&:hover": {
                      bgcolor: "#E3F2FD",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "#1976D2",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? "#1976D2" : "action.active",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: isSelected ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Divider sx={{ mt: "auto" }} />
      <Box sx={{ p: 2, bgcolor: "#F5F5F5" }}>
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Version 1.0.0
        </Typography>
        <Typography variant="caption" color="textSecondary">
          © 2024 PC Store Admin
        </Typography>
      </Box>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;

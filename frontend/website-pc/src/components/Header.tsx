import React, { useState } from "react";
import {
  AppBar,
  Badge,
  Button,
  Container,
  IconButton,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Person,
  ArrowDropDown,
  ExitToApp,
  History,
  AccountCircle,
  AdminPanelSettings,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import logo1 from "../assets/logo1.png";
import CategoryBar from "./CategoryBar";
import AuthPopup from "./AuthPopUp";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";
import SearchBar from "./searchBar";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const cart = useCart();
  const { favorites, getFavoriteCount } = useFavorites();
  const navigate = useNavigate();
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleAuthPopupOpen = () => {
    setAuthPopupOpen(true);
  };

  const handleAuthPopupClose = () => {
    setAuthPopupOpen(false);
  };
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate("/profile");
  };

  const handleOrders = () => {
    handleUserMenuClose();
    navigate("/orders");
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate("/");
  };

  const handleAdmin = () => {
    handleUserMenuClose();
    navigate("/admin");
  };

  return (
    <div>
      <AppBar
        position="sticky"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "white",
          color: "black",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              gap: 3,
              minHeight: { xs: 56, sm: 64 },
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                minWidth: "fit-content",
                flexShrink: 0,
              }}
            >
              <img
                src={logo1}
                alt="PC Store Logo"
                style={{
                  height: "45px",
                  objectFit: "fill",
                }}
              />
            </Box>

            {/* Search Bar */}
            <Box
              sx={{
                flexGrow: 1,
                maxWidth: 600,
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
              }}
            >
              <SearchBar onSearch={handleSearch} />
            </Box>

            {/* Navigation Links & Auth Section */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
              }}
            >
              {/* Auth Section */}
              {user ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    onClick={handleUserMenuOpen}
                    startIcon={
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: "primary.main",
                          fontSize: "0.75rem",
                        }}
                      >
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </Avatar>
                    }
                    endIcon={<ArrowDropDown />}
                    sx={{
                      color: "text.primary",
                      fontWeight: "bold",
                      textTransform: "none",
                      fontSize: "14px",
                      minWidth: "auto",
                      px: 2,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </Button>
                  
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 200,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <MenuItem onClick={handleProfile}>
                      <AccountCircle sx={{ mr: 2, color: "text.secondary" }} />
                      Thông tin tài khoản
                    </MenuItem>
                    <MenuItem onClick={handleOrders}>
                      <History sx={{ mr: 2, color: "text.secondary" }} />
                      Lịch sử đơn hàng
                    </MenuItem>
                    {user.role === "admin" && (
                      <React.Fragment>
                        <Divider />
                        <MenuItem
                          onClick={handleAdmin}
                          sx={{ bgcolor: "#E3F2FD" }}
                        >
                          <AdminPanelSettings
                            sx={{ mr: 2, color: "#1976D2" }}
                          />
                          <span style={{ color: "#1976D2", fontWeight: 600 }}>
                            Quản trị Admin
                          </span>
                        </MenuItem>
                      </React.Fragment>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ExitToApp sx={{ mr: 2, color: "text.secondary" }} />
                      Đăng xuất
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button
                  onClick={handleAuthPopupOpen}
                  startIcon={<Person />}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    color: "text.primary",
                    fontWeight: "bold",
                    textTransform: "none",
                    fontSize: "14px",
                    minWidth: "auto",
                    px: 2,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  Đăng nhập / Đăng ký
                </Button>
              )}

              {/* Navigation Links */}
              <Button
                component={Link}
                to="/"
                sx={{
                  color: "text.primary",
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "16px",
                  minWidth: "auto",
                  px: 2,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                Trang chủ
              </Button>
              <Button
                component={Link}
                to="/products"
                sx={{
                  color: "text.primary",
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "16px",
                  minWidth: "auto",
                  px: 2,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                Sản phẩm
              </Button>
              <Button
                component={Link}
                to="/introduction"
                sx={{
                  color: "text.primary",
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "16px",
                  minWidth: "auto",
                  px: 2,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                Giới thiệu
              </Button>

              {/* Admin Button */}
              {user && user.role === "admin" && (
                <Button
                  onClick={handleAdmin}
                  startIcon={<AdminPanelSettings />}
                  sx={{
                    color: "white",
                    backgroundColor: "#1976D2",
                    fontWeight: "bold",
                    textTransform: "none",
                    fontSize: "14px",
                    minWidth: "auto",
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    "&:hover": {
                      backgroundColor: "#1565C0",
                    },
                  }}
                >
                  Admin
                </Button>
              )}
              {/* Favorites Icon - Only show when logged in */}
              {user && (
                <IconButton
                  component={Link}
                  to="/favorites"
                  sx={{
                    color: "text.primary",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <Badge
                    badgeContent={getFavoriteCount()}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.7rem",
                        height: "18px",
                        minWidth: "18px",
                      },
                    }}
                  >
                    <FavoriteIcon />
                  </Badge>
                </IconButton>
              )}

              {/* Cart Icon với số lượng thực tế */}
              <IconButton
                component={Link}
                to="/cart"
                sx={{
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Badge
                  badgeContent={cart.getTotalItems()}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.7rem",
                      height: "18px",
                      minWidth: "18px",
                    },
                  }}
                >
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Box>

            {/* Mobile Search and Cart */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconButton
                component={Link}
                to="/cart"
                sx={{
                  color: "text.primary",
                }}
              >
                <Badge badgeContent={cart.getTotalItems()} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
              {user && (
                <IconButton
                  component={Link}
                  to="/favorites"
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  <Badge badgeContent={favorites.length} color="error">
                    <FavoriteIcon />
                  </Badge>
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Category Bar */}
      <CategoryBar />

      {/* Auth Popup */}
      <AuthPopup open={authPopupOpen} onClose={handleAuthPopupClose} />
    </div>
  );
};

export default Header;

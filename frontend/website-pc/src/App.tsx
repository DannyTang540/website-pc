import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

// User Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import OrderConfirmation from "./pages/OrderConfirmation";
import Favorites from "./pages/Favorites";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Components
import AdminLayout from "./components/admin/layout";
import AdminRoute from "./components/admin/common/AdminRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import Banners from "./pages/admin/Banners";
import Promotions from "./pages/admin/Promotions";
import Support from "./pages/admin/Support";
import Inventory from "./pages/admin/Inventory";
import Specifications from "./pages/admin/Specifications";
import FilterCriteria from "./pages/admin/FilterCriteria";
import Revenue from "./pages/admin/Revenue";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
  },
});

// AdminRoute is currently unused; admin routes can use a protected layout when needed.

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <Router>
                  <div className="App">
                    {/* Routes cho User */}
                    <Routes>
                      {/* Admin Routes - Có layout riêng, không có Header/Footer user */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route
                          path="categories"
                          element={<AdminCategories />}
                        />
                        <Route
                          path="specifications"
                          element={<Specifications />}
                        />
                        <Route path="banners" element={<Banners />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="revenue" element={<Revenue />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="roles" element={<AdminUsers />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="promotions" element={<Promotions />} />
                        <Route
                          path="filter-criteria"
                          element={<FilterCriteria />}
                        />
                        <Route path="support" element={<Support />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                      {/* User Routes - Có Header/Footer bình thường */}
                      <Route
                        path="/*"
                        element={
                          <>
                            <Header />
                            <Box
                              component="main"
                              sx={{ pt: 2, pl: 3, pr: 3, minHeight: "100vh" }}
                            >
                              <Routes>
                                <Route path="/" element={<Home />} />
                                <Route
                                  path="/products"
                                  element={<Products />}
                                />
                                <Route path="/product" element={<Products />} />
                                <Route
                                  path="/products/:slug"
                                  element={<ProductDetail />}
                                />
                                <Route
                                  path="/product/:slug"
                                  element={<ProductDetail />}
                                />
                                <Route path="/cart" element={<Cart />} />
                                <Route
                                  path="/checkout"
                                  element={<Checkout />}
                                />

                                {/* Auth Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route
                                  path="/register"
                                  element={<Register />}
                                />

                                {/* Protected Routes */}
                                <Route
                                  path="/profile"
                                  element={
                                    <ProtectedRoute>
                                      <Profile />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/orders"
                                  element={
                                    <ProtectedRoute>
                                      <OrderHistory />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/order-confirmation/:id"
                                  element={
                                    <ProtectedRoute>
                                      <OrderConfirmation />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/favorites"
                                  element={<Favorites />}
                                />

                                <Route
                                  path="/about"
                                  element={
                                    <Box sx={{ p: 3 }}>
                                      <h1>Giới thiệu</h1>
                                      <p>
                                        PC Store - Đam mê công nghệ, chất lượng
                                        tạo nên sự khác biệt
                                      </p>
                                    </Box>
                                  }
                                />
                              </Routes>
                            </Box>
                            <Footer />
                          </>
                        }
                      />
                    </Routes>
                  </div>
                </Router>
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

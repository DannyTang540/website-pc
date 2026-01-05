import React from "react";
import { Container, Paper, Typography, Box, Link } from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSuccess = (user: any) => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Đăng nhập
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Chào mừng bạn trở lại PC Store
        </Typography>

        <AuthForm mode="login" onSuccess={handleSuccess} showTabs={false} />

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Chưa có tài khoản?{" "}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ textDecoration: "none" }}
            >
              Đăng ký ngay
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;

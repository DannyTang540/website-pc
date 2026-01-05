import React from "react";
import { Container, Paper, Typography, Box, Link } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/login", { state: { registered: true } });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Đăng ký tài khoản
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Tham gia cùng PC Store ngay hôm nay
        </Typography>

        <AuthForm mode="register" onSuccess={handleSuccess} showTabs={false} />

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Đã có tài khoản?{" "}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ textDecoration: "none" }}
            >
              Đăng nhập ngay
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;

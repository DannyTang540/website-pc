import React, { useState } from "react";
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle } from "@mui/icons-material";

interface AuthFormProps {
  mode?: "login" | "register";
  onSuccess?: (user: any) => void;
  onClose?: () => void;
  showTabs?: boolean;
  initialTab?: number;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode: initialMode = "login",
  onSuccess,
  onClose,
  showTabs = false,
  initialTab = 0,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [tabValue, setTabValue] = useState(initialTab);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { login, register } = useAuth();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMode(newValue === 0 ? "login" : "register");
    setError("");
    setSuccessMessage("");
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    setShowSuccess(true);

    try {
      const user = await login(loginData.email, loginData.password);
      setSuccessMessage("Đăng nhập thành công!");
      
      // Show success state for 1.5 seconds before redirect
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.(user);
      }, 1500);
    } catch (err: any) {
      setShowSuccess(false);
      const errorMessage = err?.response?.data?.message || err?.message || "Đăng nhập thất bại";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setShowSuccess(true);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setShowSuccess(false);
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
      });
      
      setSuccessMessage("Đăng ký thành công!");
      
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.(user);
      }, 1500);
    } catch (err: any) {
      setShowSuccess(false);
      const errorMessage = err?.response?.data?.message || err?.message || "Đăng ký thất bại";
      setError(errorMessage);
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  const SuccessNotification = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          boxShadow: 24,
          maxWidth: 400,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#4caf50',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
            '& svg': {
              color: 'white',
              fontSize: 48
            }
          }}
        >
          {loading ? (
            <CircularProgress size={48} color="inherit" />
          ) : (
            <CheckCircle fontSize="inherit" />
          )}
        </Box>
        <Typography variant="h6" color="textPrimary" gutterBottom>
          {successMessage}
        </Typography>
      </Box>
    </Box>
  );

  const renderLoginForm = () => (
    <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 2 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={loginData.email}
        onChange={handleLoginChange}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        value={loginData.password}
        onChange={handleLoginChange}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ 
          mt: 2, 
          mb: 2,
          py: 1.5,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '1rem',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 3,
          },
          transition: 'all 0.2s',
        }}
      >
        {loading ? <CircularProgress size={24} /> : "Đăng nhập"}
      </Button>
    </Box>
  );

  const renderRegisterForm = () => (
    <Box component="form" onSubmit={handleRegisterSubmit} sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 2, 
        mb: 2 
      }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            required
            fullWidth
            label="Họ"
            name="lastName"
            value={registerData.lastName}
            onChange={handleRegisterChange}
            disabled={loading}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TextField
            required
            fullWidth
            label="Tên"
            name="firstName"
            value={registerData.firstName}
            onChange={handleRegisterChange}
            disabled={loading}
          />
        </Box>
      </Box>

      <TextField
        margin="normal"
        required
        fullWidth
        label="Email"
        name="email"
        type="email"
        value={registerData.email}
        onChange={handleRegisterChange}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Mật khẩu"
        type="password"
        value={registerData.password}
        onChange={handleRegisterChange}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        type="password"
        value={registerData.confirmPassword}
        onChange={handleRegisterChange}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ 
          mt: 2, 
          mb: 2,
          py: 1.5,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '1rem',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 3,
          },
          transition: 'all 0.2s',
        }}
      >
        {loading ? <CircularProgress size={24} /> : "Đăng ký"}
      </Button>
    </Box>
  );

  return (
    <>
      {showTabs && (
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            mb: 2,
            '& .MuiTabs-indicator': {
              height: 3,
            },
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
            }
          }}
        >
          <Tab label="Đăng nhập" />
          <Tab label="Đăng ký" />
        </Tabs>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
      )}

      {(!showTabs || tabValue === 0) && mode === "login" && renderLoginForm()}
      {(!showTabs || tabValue === 1) && mode === "register" && renderRegisterForm()}

      {showSuccess && <SuccessNotification />}
    </>
  );
};

export default AuthForm;
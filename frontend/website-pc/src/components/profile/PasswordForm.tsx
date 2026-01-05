import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { authService } from "../../services/authService";

interface PasswordFormProps {
  onSuccessMessage: (message: string) => void;
  onErrorMessage: (message: string) => void;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  onSuccessMessage,
  onErrorMessage,
}) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (passwordData.newPassword.length < 8) {
      onErrorMessage("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      onErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      onSuccessMessage("Đổi mật khẩu thành công");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Đổi mật khẩu thất bại";
      onErrorMessage(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto" }}>
      <Typography
        variant="h6"
        sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}
      >
        Đổi mật khẩu
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, textAlign: "center" }}
      >
        Để bảo mật tài khoản, vui lòng sử dụng mật khẩu có ít nhất 8 ký tự
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          name="currentPassword"
          label="Mật khẩu hiện tại"
          type="password"
          value={passwordData.currentPassword}
          onChange={handleChange}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label="Mật khẩu mới"
          type="password"
          value={passwordData.newPassword}
          onChange={handleChange}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          type="password"
          value={passwordData.confirmPassword}
          onChange={handleChange}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        {message && (
          <Typography color="success.main" sx={{ mt: 2, mb: 2 }}>
            {message}
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 200,
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Đổi mật khẩu"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default PasswordForm;

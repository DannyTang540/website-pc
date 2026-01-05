import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Avatar,
  Typography,
  CircularProgress,
} from "@mui/material";
import { authService } from "../../services/authService";
import type { User, UpdateProfileData } from "../../types/auth";

interface ProfileFormProps {
  user: User;
  onUpdate: (user: User) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onUpdate }) => {
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await authService.updateProfile(profileData);
      onUpdate(updatedUser);
      setMessage("Cập nhật thông tin thành công");
    } catch (err: any) {
      const errorMessage =
        err.message || "Cập nhật thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (file?: File) => {
    if (!file) return;
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước file tối đa là 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await authService.uploadAvatar(formData);
      onUpdate(response);
      setMessage("Cập nhật ảnh đại diện thành công");
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Cập nhật ảnh đại diện thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    onDrop(f);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mb: 2,
            cursor: isUploading ? "default" : "pointer",
            position: "relative",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Avatar
            src={user.avatar}
            sx={{
              width: 120,
              height: 120,
              fontSize: "3rem",
              bgcolor: "primary.main",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0)}
          </Avatar>
          {isUploading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
        </Box>
        <Typography variant="body2" color="textSecondary">
          Nhấn để thay đổi ảnh đại diện
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Họ"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Tên"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            required
          />
        </Box>

        <TextField
          fullWidth
          label="Email"
          value={user.email}
          margin="normal"
          variant="outlined"
          disabled
        />

        <TextField
          fullWidth
          label="Số điện thoại"
          name="phone"
          value={profileData.phone}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
        />

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {message && (
          <Typography color="success.main" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : "Lưu thay đổi"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProfileForm;

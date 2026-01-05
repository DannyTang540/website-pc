import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Save,
  Refresh,
  Settings as SettingsIcon,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
} from "@mui/icons-material";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  language: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  maxFileSize: number;
  imageQuality: number;
  cacheEnabled: boolean;
  sessionTimeout: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "LVTN Store",
    siteDescription: "Cửa hàng thời trang hàng đầu Việt Nam",
    contactEmail: "contact@lvtn.vn",
    contactPhone: "0123456789",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    currency: "VND",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    maxFileSize: 10,
    imageQuality: 80,
    cacheEnabled: true,
    sessionTimeout: 30,
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSnackbar({
        open: true,
        message: "Cài đặt đã được lưu thành công!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra khi lưu cài đặt!",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      siteName: "LVTN Store",
      siteDescription: "Cửa hàng thời trang hàng đầu Việt Nam",
      contactEmail: "contact@lvtn.vn",
      contactPhone: "0123456789",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      currency: "VND",
      language: "vi",
      timezone: "Asia/Ho_Chi_Minh",
      maintenanceMode: false,
      allowRegistration: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maxFileSize: 10,
      imageQuality: 80,
      cacheEnabled: true,
      sessionTimeout: 30,
    });
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <SettingsIcon />
          Cài đặt hệ thống
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetSettings}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Lưu thay đổi
          </Button>
        </Box>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {/* General Settings */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", lg: "1 1 calc(50% - 12px)" },
            minWidth: { xs: "100%", lg: "calc(50% - 12px)" },
          }}
        >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Palette />
              Cài đặt chung
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Tên trang web"
                value={settings.siteName}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
                fullWidth
              />
              <TextField
                label="Mô tả trang web"
                value={settings.siteDescription}
                onChange={(e) =>
                  handleInputChange("siteDescription", e.target.value)
                }
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Email liên hệ"
                value={settings.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                fullWidth
                type="email"
              />
              <TextField
                label="Số điện thoại"
                value={settings.contactPhone}
                onChange={(e) =>
                  handleInputChange("contactPhone", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Địa chỉ"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                fullWidth
              />
            </Box>
          </Paper>
        </Box>

        {/* Localization Settings */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", lg: "1 1 calc(50% - 12px)" },
            minWidth: { xs: "100%", lg: "calc(50% - 12px)" },
          }}
        >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Language />
              Khu vực và ngôn ngữ
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Ngôn ngữ</InputLabel>
                <Select
                  value={settings.language}
                  label="Ngôn ngữ"
                  onChange={(e) =>
                    handleInputChange("language", e.target.value)
                  }
                >
                  <MenuItem value="vi">Tiếng Việt</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tiền tệ</InputLabel>
                <Select
                  value={settings.currency}
                  label="Tiền tệ"
                  onChange={(e) =>
                    handleInputChange("currency", e.target.value)
                  }
                >
                  <MenuItem value="VND">VND - Việt Nam Đồng</MenuItem>
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Múi giờ</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Múi giờ"
                  onChange={(e) =>
                    handleInputChange("timezone", e.target.value)
                  }
                >
                  <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</MenuItem>
                  <MenuItem value="Asia/Bangkok">Asia/Bangkok</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Box>

        {/* User Settings */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", lg: "1 1 calc(50% - 12px)" },
            minWidth: { xs: "100%", lg: "calc(50% - 12px)" },
          }}
        >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Security />
              Cài đặt người dùng
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Chế độ bảo trì"
                  secondary="Tắt trang web để bảo trì hệ thống"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      handleInputChange("maintenanceMode", e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Cho phép đăng ký"
                  secondary="Người dùng mới có thể đăng ký tài khoản"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.allowRegistration}
                    onChange={(e) =>
                      handleInputChange("allowRegistration", e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Thời gian hết hạn phiên"
                  secondary={`${settings.sessionTimeout} phút`}
                />
                <ListItemSecondaryAction>
                  <TextField
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleInputChange(
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    size="small"
                    sx={{ width: 80 }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Box>

        {/* Notification Settings */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", lg: "1 1 calc(50% - 12px)" },
            minWidth: { xs: "100%", lg: "calc(50% - 12px)" },
          }}
        >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Notifications />
              Cài đặt thông báo
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Thông báo email"
                  secondary="Gửi thông báo qua email cho người dùng"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleInputChange("emailNotifications", e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Thông báo SMS"
                  secondary="Gửi thông báo qua SMS cho người dùng"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) =>
                      handleInputChange("smsNotifications", e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Thông báo đẩy"
                  secondary="Gửi thông báo đẩy trên trình duyệt"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      handleInputChange("pushNotifications", e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Box>

        {/* Storage Settings */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", lg: "1 1 calc(50% - 12px)" },
            minWidth: { xs: "100%", lg: "calc(50% - 12px)" },
          }}
        >
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Storage />
              Cài đặt lưu trữ
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Kích thước file tối đa (MB)
                </Typography>
                <TextField
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) =>
                    handleInputChange("maxFileSize", parseInt(e.target.value))
                  }
                  fullWidth
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Chất lượng ảnh (%)
                </Typography>
                <TextField
                  type="number"
                  value={settings.imageQuality}
                  onChange={(e) =>
                    handleInputChange("imageQuality", parseInt(e.target.value))
                  }
                  fullWidth
                  inputProps={{ min: 1, max: 100 }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.cacheEnabled}
                    onChange={(e) =>
                      handleInputChange("cacheEnabled", e.target.checked)
                    }
                  />
                }
                label="Bật cache"
              />
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;

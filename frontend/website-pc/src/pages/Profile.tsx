import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import ProfileForm from "../components/profile/ProfileForm";
import PasswordForm from "../components/profile/PasswordForm";
import AddressManagement from "../components/profile/AddressManagement";
import type { User, Address } from "../types/auth";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  useEffect(() => {
    let mounted = true;
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          // updateUser is stable for our use here; call once to populate context
          // eslint-disable-next-line react-hooks/exhaustive-deps
          updateUser(userData);

          const addrs = await authService.addressService.getAddresses();
          if (mounted) setAddresses(addrs);
        }
      } catch (err) {
        if (mounted) setError("Không thể tải thông tin người dùng");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchAddresses = async () => {
    try {
      const addresses = await authService.addressService.getAddresses();
      setAddresses(addresses);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Không thể tải địa chỉ");
    }
  };

  const handleSuccess = (message: string) => {
    setSuccess(message);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const handleCloseSuccess = () => {
    setSuccess("");
  };

  const handleCloseError = () => {
    setError("");
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    if (user) {
      updateUser({ ...user, ...userData });
      setSuccess("Cập nhật thông tin thành công");
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccess("Đổi mật khẩu thành công");
  };

  const handlePasswordChangeError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="profile tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Thông tin cá nhân" />
          <Tab label="Đổi mật khẩu" />
          <Tab label="Địa chỉ giao hàng" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        <TabPanel value={tabValue} index={0}>
          <ProfileForm user={user} onUpdate={handleUpdateUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PasswordForm
            onSuccessMessage={handlePasswordChangeSuccess}
            onErrorMessage={handlePasswordChangeError}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AddressManagement
            addresses={addresses}
            onAddressesChange={setAddresses}
            onError={handleError}
            onSuccess={handleSuccess}
          />
        </TabPanel>
      </Box>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;

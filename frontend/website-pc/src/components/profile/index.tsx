import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
} from "@mui/material";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import AddressManagement from "./AddressManagement";
import type { User, Address } from "../../types/auth";

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
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user data and addresses
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (user) {
          setCurrentUser(user);
          // Load addresses
          const userAddresses = await authService.addressService.getAddresses();
          setAddresses(userAddresses);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
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

  if (!currentUser) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">
          Vui lòng đăng nhập để xem thông tin cá nhân
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="profile tabs"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 3,
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Thông tin cá nhân" />
          <Tab label="Đổi mật khẩu" />
          <Tab label="Địa chỉ" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ProfileForm user={currentUser} onUpdate={updateUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PasswordForm
            onSuccessMessage={(m) => console.log(m)}
            onErrorMessage={(m) => console.error(m)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AddressManagement
            addresses={addresses}
            onAddressesChange={setAddresses}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile;

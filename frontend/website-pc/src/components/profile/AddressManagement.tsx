import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { authService } from "../../services/authService";
import type { Address } from "../../types/auth";

// Extend the base Address type to include the type property
// Extend the base Address type to make type optional with a default value
type ExtendedAddress = Omit<Address, "type"> & {
  type?: "home" | "office" | "other";
};

interface AddressManagementProps {
  addresses: Address[];
  onAddressesChange: (addresses: Address[]) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

const AddressManagement: React.FC<AddressManagementProps> = ({
  addresses,
  onAddressesChange,
  onError = () => {},
  onSuccess = () => {},
}) => {
  const theme = useTheme();
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  // Local state for form errors and success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [addressData, setAddressData] = useState<Partial<ExtendedAddress>>({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    district: "",
    ward: "",
    isDefault: false,
    type: "home",
  });

  const handleOpenForm = (address: Address | null = null) => {
    if (address) {
      // Create a new object with type property
      const addressWithType = {
        ...address,
        ...((address as any).type
          ? { type: (address as any).type }
          : { type: "home" }),
      };

      setEditingAddress(addressWithType);
      setAddressData(addressWithType);
    } else {
      setEditingAddress(null);
      setAddressData({
        firstName: "",
        lastName: "",
        phone: "",
        street: "",
        city: "",
        district: "",
        ward: "",
        isDefault: addresses.length === 0, // Set as default if it's the first address
        type: "home",
      });
    }
    setAddressFormOpen(true);
  };

  const handleCloseForm = () => {
    setAddressFormOpen(false);
    setError("");
    setSuccess("");
    onError("");
    onSuccess("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveAddress = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      onError("");
      onSuccess("");

      if (
        !addressData.street ||
        !addressData.city ||
        !addressData.district ||
        !addressData.ward
      ) {
        const errorMsg = "Vui lòng điền đầy đủ thông tin địa chỉ";
        setError(errorMsg);
        onError(errorMsg);
        return;
      }

      // Prepare address data
      const addressToSave = {
        ...addressData,
        isDefault: addressData.isDefault || false,
        type: addressData.type || "home",
      };

      if (editingAddress && editingAddress.id) {
        // Update existing address
        const updatedAddress = await authService.addressService.updateAddress(
          editingAddress.id,
          addressToSave as Address
        );
        onAddressesChange(
          addresses.map((addr) =>
            addr.id === editingAddress.id ? updatedAddress : addr
          )
        );
        const successMsg = "Cập nhật địa chỉ thành công";
        setSuccess(successMsg);
        onSuccess(successMsg);
      } else {
        // Add new address
        const newAddress = await authService.addressService.addAddress(
          addressToSave as Address
        );
        onAddressesChange([...addresses, newAddress]);
        const successMsg = "Thêm địa chỉ thành công";
        setSuccess(successMsg);
        onSuccess(successMsg);
      }

      // If set as default, update other addresses
      if (addressToSave.isDefault) {
        const addressId =
          editingAddress?.id ||
          (addresses.length > 0 ? addresses[addresses.length - 1].id : "");
        if (addressId) {
          await handleSetDefault(addressId);
        }
      }

      // Close form after a short delay to show success message
      setTimeout(handleCloseForm, 1000);
    } catch (err: any) {
      const errorMsg = err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.";
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

    try {
      setLoading(true);
      await authService.addressService.deleteAddress(id);
      onAddressesChange(addresses.filter((addr) => addr.id !== id));
      const successMsg = "Đã xóa địa chỉ";
      setSuccess(successMsg);
      onSuccess(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || "Xóa địa chỉ thất bại";
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true);
      // Update the address to be default
      const address = addresses.find((addr) => addr.id === id);
      if (address) {
        await authService.addressService.updateAddress(id, {
          ...address,
          isDefault: true,
        } as Address);

        // Update local state to reflect the change
        onAddressesChange(
          addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          }))
        );

        const successMsg = "Đã cập nhật địa chỉ mặc định";
        setSuccess(successMsg);
        onSuccess(successMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Cập nhật địa chỉ mặc định thất bại";
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <HomeIcon color="primary" fontSize="small" />;
      case "work":
        return <WorkIcon color="primary" fontSize="small" />;
      default:
        return <LocationOnIcon color="primary" fontSize="small" />;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Địa chỉ giao hàng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Thêm địa chỉ mới
        </Button>
      </Box>

      {addresses.length === 0 ? (
        <Box textAlign="center" py={4}>
          <LocationOnIcon
            sx={{ fontSize: 48, color: "text.secondary", opacity: 0.5, mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Bạn chưa có địa chỉ nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Thêm địa chỉ để thuận tiện cho việc mua sắm
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Thêm địa chỉ mới
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            "& > *": {
              width: { xs: "100%", md: "calc(50% - 12px)" },
              minWidth: 0,
            },
          }}
        >
          {addresses.map((address) => (
            <Box key={address.id}>
              <Card
                sx={{
                  height: "100%",
                  border: address.isDefault
                    ? `2px solid ${theme.palette.primary.main}`
                    : "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  "&:hover": {
                    boxShadow: theme.shadows[2],
                  },
                  position: "relative",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {getAddressTypeIcon(
                      (address as ExtendedAddress).type || "home"
                    )}
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ ml: 1 }}
                    >
                      {(address as ExtendedAddress).type === "home"
                        ? "Nhà riêng"
                        : "Văn phòng"}
                    </Typography>
                    {address.isDefault && (
                      <Chip
                        label="Mặc định"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 2 }}
                      />
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      onClick={() => handleOpenForm(address)}
                      disabled={loading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        address.id && handleDeleteAddress(address.id)
                      }
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {address.firstName} {address.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.phone}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {address.street}, {address.ward}, {address.district},{" "}
                    {address.city}
                  </Typography>

                  {!address.isDefault && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => address.id && handleSetDefault(address.id)}
                      disabled={loading}
                      sx={{ mt: 1 }}
                    >
                      Đặt làm mặc định
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog
        open={addressFormOpen}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>
          {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="Họ"
                  name="lastName"
                  value={addressData.lastName || ""}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="Tên"
                  name="firstName"
                  value={addressData.firstName || ""}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Số điện thoại"
              name="phone"
              value={addressData.phone || ""}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Địa chỉ"
              name="street"
              value={addressData.street || ""}
              onChange={handleInputChange}
              margin="normal"
              required
              placeholder="Số nhà, tên đường"
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="Tỉnh/Thành phố"
                  name="city"
                  value={addressData.city || ""}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="Quận/Huyện"
                  name="district"
                  value={addressData.district || ""}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="Phường/Xã"
                  name="ward"
                  value={addressData.ward || ""}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  select
                  fullWidth
                  label="Loại địa chỉ"
                  name="type"
                  value={addressData.type || "home"}
                  onChange={handleInputChange}
                  margin="normal"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="home">Nhà riêng</option>
                  <option value="office">Văn phòng</option>
                  <option value="other">Khác</option>
                </TextField>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="isDefault"
                  checked={!!addressData.isDefault}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Đặt làm địa chỉ mặc định"
              sx={{ mt: 2, display: "block" }}
            />

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            {success && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                {success}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCloseForm}
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveAddress}
            variant="contained"
            disabled={
              loading ||
              !addressData.street ||
              !addressData.city ||
              !addressData.district ||
              !addressData.ward
            }
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingAddress ? (
              "Cập nhật"
            ) : (
              "Thêm địa chỉ"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManagement;

import { useState, useContext, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  Fade,
  useTheme,
  alpha,
  Card,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  LocalShipping,
  Payment,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  CreditCard,
  AccountBalance,
  AttachMoney,
  ShoppingCart,
} from "@mui/icons-material";
import { CartContext } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import OrderSummary from "../components/OrderSummary";
// Helper function to get full name from user object
const getFullName = (user: {
  firstName?: string;
  lastName?: string;
}): string => {
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  return `${firstName} ${lastName}`.trim();
};

interface Address {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

const steps = [
  "Thông tin giao hàng",
  "Phương thức thanh toán",
  "Xác nhận đơn hàng",
];

const Checkout: React.FC = () => {
  const cartContext = useContext(CartContext);
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(true);

  // Load saved addresses when component mounts
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (user?.id) {
        try {
          // Fetch user's addresses from the backend
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5000/api"
            }/user/addresses`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Không thể tải địa chỉ giao hàng");
          }

          const addresses = await response.json();
          setSavedAddresses(addresses);

          // Set default address if available
          const defaultAddress = addresses.find(
            (addr: Address) => addr.isDefault
          );
          if (defaultAddress) {
            setShippingInfo({
              fullName: defaultAddress.fullName || getFullName(user) || "",
              phone: defaultAddress.phone || user.phone || "",
              email: defaultAddress.email || user.email || "",
              address: defaultAddress.address || "",
              city: defaultAddress.city || "",
              district: defaultAddress.district || "",
              ward: defaultAddress.ward || "",
              note: "",
            });
          } else if (addresses.length > 0) {
            // If no default but has addresses, use the first one
            const firstAddress = addresses[0];
            setShippingInfo({
              fullName: firstAddress.fullName || getFullName(user) || "",
              phone: firstAddress.phone || user.phone || "",
              email: firstAddress.email || user.email || "",
              address: firstAddress.address || "",
              city: firstAddress.city || "",
              district: firstAddress.district || "",
              ward: firstAddress.ward || "",
              note: "",
            });
          } else {
            // If no saved addresses, pre-fill with user's basic info
            setShippingInfo((prev) => ({
              ...prev,
              fullName: getFullName(user) || "",
              phone: user.phone || "",
              email: user.email || "",
            }));
          }
        } catch (error) {
          console.error("Error loading saved addresses:", error);
          // Fallback to user's basic info if there's an error
          setShippingInfo((prev) => ({
            ...prev,
            fullName: getFullName(user) || "",
            phone: user.phone || "",
            email: user.email || "",
          }));
        }
      }
    };

    loadSavedAddresses();
  }, [user]);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const theme = useTheme();

  if (!cartContext) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Không thể tải giỏ hàng</Alert>
      </Container>
    );
  }

  const { cartItems, getTotalPrice, clearCart } = cartContext;

  const handleUseAddress = (address: Address) => {
    setShippingInfo({
      fullName: address.fullName,
      phone: address.phone,
      email: address.email,
      address: address.address,
      city: address.city,
      district: address.district,
      ward: address.ward,
      note: "",
    });
    setShowSavedAddresses(false);
  };

  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handlePlaceOrder();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Prepare order data
      const orderData = {
        userId: user?.id,
        total: getTotalPrice(),
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.city}`,
        city: shippingInfo.city,
        phone: shippingInfo.phone,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image || "",
        })),
      };

      // Make API call to create order
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể tạo đơn hàng");
      }

      const result = await response.json();

      // Only clear cart if order was created successfully
      clearCart();

      // Show success message
      setShowSuccessAlert(true);

      // Redirect to order confirmation page after 2 seconds
      setTimeout(() => {
        window.location.href = `/order-confirmation/${result.orderId}`;
      }, 2000);
    } catch (error: any) {
      console.error("Error placing order:", error);
      // Show error message to user
      alert(error?.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return (
          shippingInfo.fullName && shippingInfo.phone && shippingInfo.address
        );
      case 1:
        return paymentMethod;
      case 2:
        return true;
      default:
        return false;
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.
        </Alert>
      </Container>
    );
  }

  return (
    <Fade in timeout={600}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {showSuccessAlert && (
          <Alert
            severity="success"
            sx={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 1000,
              borderRadius: 2,
            }}
          >
            Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: "white",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ShoppingCart sx={{ fontSize: "2.5rem" }} />
            Thanh toán
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Hoàn tất đơn hàng của bạn trong vài bước đơn giản
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Box sx={{ mb: 4 }}>
          <Fade in timeout={400}>
            <Box>
              {activeStep === 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                    gap: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: `linear-gradient(145deg, ${alpha(
                        theme.palette.background.paper,
                        0.9
                      )} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <LocalShipping
                        sx={{ fontSize: 28, color: "primary.main" }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          Thông tin giao hàng
                        </Typography>
                        {showSavedAddresses && savedAddresses.length > 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setShowSavedAddresses(false)}
                          >
                            Nhập thông tin mới
                          </Button>
                        )}
                      </Box>

                      {showSavedAddresses && savedAddresses.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Địa chỉ đã lưu:
                          </Typography>
                          {savedAddresses.map((address) => (
                            <Paper
                              key={address.id}
                              sx={{
                                p: 2,
                                mb: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                position: "relative",
                              }}
                            >
                              <Box>
                                <Typography variant="subtitle1">
                                  {address.fullName}
                                </Typography>
                                <Typography variant="body2">
                                  {address.phone} | {address.email}
                                </Typography>
                                <Typography variant="body2">
                                  {address.address}, {address.ward},{" "}
                                  {address.district}, {address.city}
                                </Typography>
                                {address.isDefault && (
                                  <Box
                                    component="span"
                                    sx={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      bgcolor: "primary.main",
                                      color: "white",
                                      px: 1,
                                      borderRadius: 1,
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    Mặc định
                                  </Box>
                                )}
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleUseAddress(address)}
                                sx={{ mt: 1 }}
                                fullWidth
                              >
                                Giao đến địa chỉ này
                              </Button>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </Box>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <TextField
                        required
                        fullWidth
                        label="Họ và tên"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleShippingInfoChange}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          required
                          fullWidth
                          label="Số điện thoại"
                          name="phone"
                          value={shippingInfo.phone}
                          onChange={handleShippingInfoChange}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={shippingInfo.email}
                          onChange={handleShippingInfoChange}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>

                      <TextField
                        required
                        fullWidth
                        label="Địa chỉ"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleShippingInfoChange}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(3, 1fr)",
                          },
                          gap: 2,
                        }}
                      >
                        <TextField
                          fullWidth
                          label="Tỉnh/Thành phố"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleShippingInfoChange}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Quận/Huyện"
                          name="district"
                          value={shippingInfo.district}
                          onChange={handleShippingInfoChange}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Phường/Xã"
                          name="ward"
                          value={shippingInfo.ward}
                          onChange={handleShippingInfoChange}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>

                      <TextField
                        fullWidth
                        label="Ghi chú"
                        name="note"
                        multiline
                        rows={3}
                        value={shippingInfo.note}
                        onChange={handleShippingInfoChange}
                        placeholder="Ghi chú thêm về đơn hàng..."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  </Paper>

                  <OrderSummary items={cartItems} total={getTotalPrice()} />
                </Box>
              )}

              {activeStep === 1 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                    gap: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: `linear-gradient(145deg, ${alpha(
                        theme.palette.background.paper,
                        0.9
                      )} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Payment sx={{ fontSize: 28, color: "primary.main" }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Phương thức thanh toán
                      </Typography>
                    </Box>

                    <FormControl component="fieldset">
                      <RadioGroup
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Card
                          sx={{
                            p: 3,
                            border:
                              paymentMethod === "cod"
                                ? "2px solid"
                                : "1px solid",
                            borderColor:
                              paymentMethod === "cod"
                                ? "primary.main"
                                : "divider",
                            borderRadius: 2,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: theme.shadows[4],
                            },
                          }}
                        >
                          <FormControlLabel
                            value="cod"
                            control={<Radio />}
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  ml: 1,
                                }}
                              >
                                <AttachMoney
                                  sx={{ fontSize: 24, color: "success.main" }}
                                />
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Thanh toán khi nhận hàng (COD)
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Thanh toán bằng tiền mặt khi nhận sản phẩm
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </Card>

                        <Card
                          sx={{
                            p: 3,
                            border:
                              paymentMethod === "card"
                                ? "2px solid"
                                : "1px solid",
                            borderColor:
                              paymentMethod === "card"
                                ? "primary.main"
                                : "divider",
                            borderRadius: 2,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: theme.shadows[4],
                            },
                          }}
                        >
                          <FormControlLabel
                            value="card"
                            control={<Radio />}
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  ml: 1,
                                }}
                              >
                                <CreditCard
                                  sx={{ fontSize: 24, color: "info.main" }}
                                />
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Thẻ tín dụng/Ghi nợ
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Visa, Mastercard, JCB
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </Card>

                        <Card
                          sx={{
                            p: 3,
                            border:
                              paymentMethod === "bank"
                                ? "2px solid"
                                : "1px solid",
                            borderColor:
                              paymentMethod === "bank"
                                ? "primary.main"
                                : "divider",
                            borderRadius: 2,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: theme.shadows[4],
                            },
                          }}
                        >
                          <FormControlLabel
                            value="bank"
                            control={<Radio />}
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  ml: 1,
                                }}
                              >
                                <AccountBalance
                                  sx={{ fontSize: 24, color: "warning.main" }}
                                />
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Chuyển khoản ngân hàng
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Chuyển khoản qua internet banking
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </Card>
                      </RadioGroup>
                    </FormControl>
                  </Paper>

                  <OrderSummary items={cartItems} total={getTotalPrice()} />
                </Box>
              )}

              {activeStep === 2 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                    gap: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: `linear-gradient(145deg, ${alpha(
                        theme.palette.background.paper,
                        0.9
                      )} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <CheckCircle
                        sx={{ fontSize: 28, color: "success.main" }}
                      />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Xác nhận đơn hàng
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Thông tin giao hàng
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Người nhận:</strong> {shippingInfo.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Điện thoại:</strong> {shippingInfo.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Email:</strong> {shippingInfo.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Địa chỉ:</strong> {shippingInfo.address},{" "}
                            {shippingInfo.ward}, {shippingInfo.district},{" "}
                            {shippingInfo.city}
                          </Typography>
                          {shippingInfo.note && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Ghi chú:</strong> {shippingInfo.note}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Phương thức thanh toán
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {paymentMethod === "cod" &&
                              "Thanh toán khi nhận hàng (COD)"}
                            {paymentMethod === "card" && "Thẻ tín dụng/Ghi nợ"}
                            {paymentMethod === "bank" &&
                              "Chuyển khoản ngân hàng"}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Sản phẩm ({cartItems.length} sản phẩm)
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {cartItems.map((item, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    backgroundColor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {item.quantity}x
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {item.name}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(item.price * item.quantity)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  <OrderSummary items={cartItems} total={getTotalPrice()} />
                </Box>
              )}
            </Box>
          </Fade>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Quay lại
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid() || isProcessing}
            endIcon={
              isProcessing ? (
                <CircularProgress size={20} />
              ) : activeStep === steps.length - 1 ? (
                <CheckCircle />
              ) : (
                <ArrowForward />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: theme.shadows[4],
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: theme.shadows[8],
                transform: "translateY(-2px)",
              },
            }}
          >
            {isProcessing
              ? "Đang xử lý..."
              : activeStep === steps.length - 1
              ? "Xác nhận đặt hàng"
              : "Tiếp tục"}
          </Button>
        </Box>
      </Container>
    </Fade>
  );
};

export default Checkout;

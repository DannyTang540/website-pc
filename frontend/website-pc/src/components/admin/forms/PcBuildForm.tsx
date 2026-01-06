// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  // Grid component removed
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import type {
  ComputerComponent,
  ComponentCategory,
  BuildConfiguration,
  CompatibilityCheckResult,
} from "../../../types/component";

// Mock data - Replace with actual API calls
const mockComponents: ComputerComponent[] = [
  {
    id: "cpu1",
    name: "Intel Core i5-12600K",
    type: "cpu",
    brand: "Intel",
    model: "i5-12600K",
    price: 250,
    specifications: [
      { name: "Socket", value: "LGA1700", type: "socket" },
      { name: "Cores/Threads", value: "10/16", type: "core" },
      { name: "Base Clock", value: "3.7 GHz", type: "clock" },
      { name: "TDP", value: "125W", type: "tdp" },
    ],
    compatibility: {
      rams: ["DDR4", "DDR5"],
    },
    stock: 15,
    status: "in_stock",
  },
  {
    id: "mb1",
    name: "MSI MAG B660 TOMAHAWK WIFI",
    type: "motherboard",
    brand: "MSI",
    model: "MAG B660 TOMAHAWK WIFI",
    price: 189,
    specifications: [
      { name: "Socket", value: "LGA1700", type: "socket" },
      { name: "Chipset", value: "Intel B660" },
      { name: "RAM Type", value: "DDR4" },
      { name: "Form Factor", value: "ATX" },
      { name: "PCIe Slots", value: "2 x PCIe 4.0 x16" },
    ],
    compatibility: {
      cpus: ["LGA1700"],
      rams: ["DDR4"],
    },
    stock: 8,
    status: "in_stock",
  },
  {
    id: "ram1",
    name: "Corsair Vengeance RGB Pro 16GB",
    type: "ram",
    brand: "Corsair",
    model: "CMW16GX4M2D3600C18",
    price: 89,
    specifications: [
      { name: "Capacity", value: "16GB (2x8GB)" },
      { name: "Type", value: "DDR4" },
      { name: "Speed", value: "3600MHz" },
      { name: "Timing", value: "CL18" },
    ],
    stock: 25,
    status: "in_stock",
  },
];

const componentCategories: ComponentCategory[] = [
  {
    id: "cpu",
    name: "CPU",
    type: "cpu",
    description: "Central Processing Unit",
  },
  {
    id: "motherboard",
    name: "Mainboard",
    type: "motherboard",
    description: "Mainboard",
  },
  { id: "ram", name: "RAM", type: "ram", description: "Memory" },
  { id: "gpu", name: "VGA", type: "gpu", description: "Graphics Card" },
  { id: "storage", name: "SSD", type: "storage", description: "Storage" },
  { id: "psu", name: "Nguồn", type: "psu", description: "Power Supply" },
  { id: "case", name: "Case", type: "case", description: "PC Case" },
  {
    id: "cooler",
    name: "Tản nhiệt",
    type: "cooler",
    description: "CPU Cooler",
  },
];

interface PcBuildFormProps {
  open: boolean;
  onSave: (build: BuildConfiguration) => void;
  onCancel: () => void;
}

const PcBuildForm: React.FC<PcBuildFormProps> = ({
  open,
  onSave,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [build, setBuild] = useState<BuildConfiguration>({});
  const [components, setComponents] = useState<ComputerComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<
    ComputerComponent[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [compatibility, setCompatibility] = useState<CompatibilityCheckResult>({
    compatible: false,
    issues: [],
    warnings: [],
  });

  // Load components on mount
  useEffect(() => {
    const fetchComponents = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await api.get('/api/components');
        // setComponents(response.data);
        setComponents(mockComponents);
      } catch (error) {
        console.error("Failed to load components:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchComponents();
    }
  }, [open]);

  // Filter components by current category
  useEffect(() => {
    if (activeStep < componentCategories.length) {
      const currentCategory = componentCategories[activeStep];
      const filtered = components.filter(
        (comp) => comp.type === currentCategory.type
      );
      setFilteredComponents(filtered);
    }
  }, [activeStep, components]);

  // Check compatibility when build changes
  useEffect(() => {
    checkCompatibility();
  }, [build]);

  const handleNext = () => {
    if (activeStep < componentCategories.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleComponentSelect = (component: ComputerComponent) => {
    const newBuild = { ...build };

    switch (component.type) {
      case "cpu":
        newBuild.cpu = component;
        break;
      case "motherboard":
        newBuild.motherboard = component;
        break;
      case "ram":
        newBuild.ram = component;
        break;
      case "gpu":
        newBuild.gpu = component;
        break;
      case "storage":
        newBuild.storage = newBuild.storage || [];
        newBuild.storage = [...newBuild.storage, component];
        break;
      case "psu":
        newBuild.psu = component;
        break;
      case "case":
        newBuild.case = component;
        break;
      case "cooler":
        newBuild.cooler = component;
        break;
    }

    setBuild(newBuild);

    // Auto-advance to next step if not the last step
    if (activeStep < componentCategories.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  };

  const checkCompatibility = (): CompatibilityCheckResult => {
    const issues: string[] = [];
    const warnings: string[] = [];
    let compatible = true;

    // Check CPU and Motherboard compatibility
    if (build.cpu && build.motherboard) {
      const cpuSocket = build.cpu.specifications.find(
        (s) => s.name === "Socket"
      )?.value;
      const mbSocket = build.motherboard.specifications.find(
        (s) => s.name === "Socket"
      )?.value;

      if (cpuSocket !== mbSocket) {
        issues.push(
          `CPU socket (${cpuSocket}) không tương thích với mainboard (${mbSocket})`
        );
        compatible = false;
      }
    }

    // Check RAM and Motherboard compatibility
    if (build.ram && build.motherboard) {
      const ramType = build.ram.specifications.find(
        (s) => s.name === "Type"
      )?.value;
      const mbRamType = build.motherboard.specifications.find(
        (s) => s.name === "RAM Type"
      )?.value;

      if (ramType && mbRamType && ramType !== mbRamType) {
        issues.push(
          `Loại RAM (${ramType}) không tương thích với mainboard (${mbRamType})`
        );
        compatible = false;
      }
    }

    // Check PSU wattage if PSU and other components are selected
    if (build.psu) {
      // This is a simplified check - in a real app, you'd calculate total power draw
      const psuWattage = parseInt(
        build.psu.specifications.find((s) => s.name === "Wattage")?.value || "0"
      );

      if (build.gpu && psuWattage < 500) {
        warnings.push("Nguồn có thể không đủ công suất cho cấu hình này");
      }
    }

    // Check case and motherboard form factor
    if (build.case && build.motherboard) {
      const mbFormFactor = build.motherboard.specifications.find(
        (s) => s.name === "Form Factor"
      )?.value;
      const caseFormFactors = build.case.compatibility?.cases?.formFactor || [];

      if (
        mbFormFactor &&
        caseFormFactors.length > 0 &&
        !caseFormFactors.includes(mbFormFactor)
      ) {
        warnings.push(`Mainboard ${mbFormFactor} có thể không vừa với case`);
      }
    }

    const result = {
      compatible,
      issues,
      warnings,
    };

    setCompatibility(result);
    return result;
  };

  const handleSave = () => {
    const result = checkCompatibility();
    if (
      result.compatible ||
      window.confirm(
        "Có một số vấn đề tương thích. Bạn có chắc chắn muốn lưu không?"
      )
    ) {
      onSave(build);
    }
  };

  const renderComponentCard = (component: ComputerComponent) => {
    const isSelected =
      (component.type === "cpu" && build.cpu?.id === component.id) ||
      (component.type === "motherboard" &&
        build.motherboard?.id === component.id) ||
      (component.type === "ram" && build.ram?.id === component.id) ||
      (component.type === "gpu" && build.gpu?.id === component.id) ||
      (component.type === "storage" &&
        build.storage?.some((s) => s.id === component.id)) ||
      (component.type === "psu" && build.psu?.id === component.id) ||
      (component.type === "case" && build.case?.id === component.id) ||
      (component.type === "cooler" && build.cooler?.id === component.id);

    return (
      <Box
        key={component.id}
        sx={{
          width: "100%",
          p: 1,
          boxSizing: "border-box",
          flex: { xs: "0 0 100%", sm: "0 0 50%", md: "0 0 33.3333%" },
          maxWidth: { xs: "100%", sm: "50%", md: "33.3333%" },
        }}
      >
        <Card
          variant={isSelected ? "outlined" : "elevation"}
          sx={{
            height: "100%",
            border: isSelected ? "2px solid #1976d2" : "none",
            "&:hover": {
              boxShadow: 3,
            },
          }}
        >
          <CardActionArea onClick={() => handleComponentSelect(component)}>
            <CardMedia
              component="img"
              height="140"
              image={component.image || "/placeholder-component.jpg"}
              alt={component.name}
              sx={{ objectFit: "contain", p: 2, bgcolor: "#f5f5f5" }}
            />
            <CardContent>
              <Typography variant="h6" component="div" noWrap>
                {component.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {component.brand} • {component.model}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                ${component.price}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {component.specifications.slice(0, 3).map((spec, index) => (
                  <Chip
                    key={index}
                    label={`${spec.name}: ${spec.value}`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
              {component.stock < 5 && (
                <Typography variant="caption" color="error">
                  {component.stock === 0
                    ? "Hết hàng"
                    : `Chỉ còn ${component.stock} sản phẩm`}
                </Typography>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    );
  };

  const renderSelectedComponents = () => {
    const selectedComponents = [
      { type: "CPU", component: build.cpu },
      { type: "Mainboard", component: build.motherboard },
      { type: "RAM", component: build.ram },
      { type: "VGA", component: build.gpu },
      { type: "SSD", component: build.storage?.[0] },
      { type: "Nguồn", component: build.psu },
      { type: "Case", component: build.case },
      { type: "Tản nhiệt", component: build.cooler },
    ].filter((item) => item.component);

    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
          p: 2,
          bgcolor: "#f9f9f9",
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ width: "100%" }}>
          Các linh kiện đã chọn:
        </Typography>
        {selectedComponents.map((item, index) => (
          <Chip
            key={index}
            label={`${item.type}: ${item.component?.name}`}
            onDelete={() => {
              const newBuild = { ...build };
              switch (item.type.toLowerCase()) {
                case "cpu":
                  delete newBuild.cpu;
                  break;
                case "mainboard":
                  delete newBuild.motherboard;
                  break;
                case "ram":
                  delete newBuild.ram;
                  break;
                case "vga":
                  delete newBuild.gpu;
                  break;
                case "ssd":
                  newBuild.storage = [];
                  break;
                case "nguồn":
                  delete newBuild.psu;
                  break;
                case "case":
                  delete newBuild.case;
                  break;
                case "tản nhiệt":
                  delete newBuild.cooler;
                  break;
              }
              setBuild(newBuild);
            }}
            sx={{ m: 0.5 }}
          />
        ))}
      </Box>
    );
  };

  const renderCompatibilityIssues = () => {
    if (
      compatibility.issues.length === 0 &&
      compatibility.warnings.length === 0
    ) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        {compatibility.issues.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Vấn đề tương thích:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {compatibility.issues.map((issue, index) => (
                <li key={index}>
                  <Typography variant="body2">{issue}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {compatibility.warnings.length > 0 && (
          <Alert severity="warning">
            <Typography variant="subtitle2" gutterBottom>
              Cảnh báo:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {compatibility.warnings.map((warning, index) => (
                <li key={index}>
                  <Typography variant="body2">{warning}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </Box>
    );
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (activeStep < componentCategories.length) {
      const currentCategory = componentCategories[activeStep];

      return (
        <>
          <Typography variant="h6" gutterBottom>
            Chọn {currentCategory.name.toLowerCase()}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {currentCategory.description}
          </Typography>

          {filteredComponents.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", m: -1 }}>
              {filteredComponents.map(renderComponentCard)}
            </Box>
          ) : (
            <Box textAlign="center" p={4}>
              <Typography variant="body1" color="textSecondary">
                Không tìm thấy {currentCategory.name.toLowerCase()} phù hợp.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => {
                  // TODO: Open component creation dialog
                  alert("Chức năng thêm linh kiện mới sẽ được thêm sau");
                }}
              >
                Thêm {currentCategory.name} mới
              </Button>
            </Box>
          )}
        </>
      );
    }

    // Final step - Review and save
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Xác nhận cấu hình
        </Typography>

        {renderSelectedComponents()}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Tổng cộng: ${calculateTotalPrice()}
          </Typography>

          {compatibility.compatible ? (
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
            >
              Tất cả các linh kiện tương thích với nhau.
            </Alert>
          ) : (
            <Alert icon={<WarningIcon fontSize="inherit" />} severity="error">
              Có vấn đề về tương thích giữa các linh kiện.
            </Alert>
          )}

          {renderCompatibilityIssues()}
        </Box>
      </Box>
    );
  };

  const calculateTotalPrice = (): number => {
    return [
      build.cpu?.price || 0,
      build.motherboard?.price || 0,
      build.ram?.price || 0,
      build.gpu?.price || 0,
      ...(build.storage?.map((s) => s.price) || []),
      build.psu?.price || 0,
      build.case?.price || 0,
      build.cooler?.price || 0,
    ].reduce((sum, price) => sum + price, 0);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="lg"
      fullWidth
      sx={{ "& .MuiDialog-paper": { height: "90vh" } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Tạo cấu hình PC mới</span>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {componentCategories.map((category, index) => (
            <Step key={category.id} completed={index < activeStep}>
              <StepLabel>{category.name}</StepLabel>
            </Step>
          ))}
          <Step key="review">
            <StepLabel>Xác nhận</StepLabel>
          </Step>
        </Stepper>

        <Box sx={{ minHeight: "400px", overflowY: "auto", p: 1 }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Box>
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Quay lại
            </Button>
          )}
          {activeStep < componentCategories.length && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={
                !build[
                  componentCategories[activeStep]
                    ?.type as keyof BuildConfiguration
                ]
              }
            >
              {activeStep === componentCategories.length - 1
                ? "Xác nhận"
                : "Tiếp theo"}
            </Button>
          )}
        </Box>

        {activeStep === componentCategories.length && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!compatibility.compatible}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Lưu cấu hình
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PcBuildForm;

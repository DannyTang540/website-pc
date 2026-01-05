// components/admin/forms/ProductForm.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Stack,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload,
} from "@mui/icons-material";
import { adminService } from "../../../services/adminService";
import { toast } from "react-toastify";

// Định nghĩa interface cho props
// components/admin/forms/ProductForm.tsx
interface ProductFormProps {
  open: boolean;
  product?: {
    // Core product fields
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    categoryId?: string;
    brand?: string;
    images?: (string | File)[];
    stockQuantity?: number;
    inStock?: boolean;
    featured?: boolean;
    status?: "active" | "inactive";
    slug?: string;
    tags?: string[];
    shortDescription?: string;

    // Handle both specs and specifications
    specifications?: Record<string, any> | any[];
    specs?: Record<string, any> | any[];

    // Optional fields
    createdAt?: string;
    updatedAt?: string;
  } | null;
  onSave: (product: any) => Promise<void>; // Update this with proper type if needed
  onCancel: () => void;
}

// Định nghĩa interface cho specification

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  brand: string;
  images: (string | File)[];
  specifications: Record<string, any>;
  stock: number;
  minimumStock: number;
  status: "active" | "inactive" | "draft";
  isFeatured: boolean;
  isComponent: boolean;
  tags: string[];
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  product,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: 0,
    originalPrice: 0,
    categoryId: "",
    brand: "",
    images: [],
    specifications: {},
    stock: 0,
    minimumStock: 0,
    status: "inactive",
    isFeatured: false,
    isComponent: false,
    tags: [],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [componentCategoryIds, setComponentCategoryIds] = useState<string[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [specInput, setSpecInput] = useState({
    name: "",
    value: "",
  } as { name: string; value: string });

  // Components (slots) state
  const componentSlots = [
    "CPU",
    "Main",
    "RAM",
    "SSD",
    "PSU",
    "FAN",
    "VGA",
    "Case",
  ] as const;
  type Slot = (typeof componentSlots)[number];
  const [componentsMap, setComponentsMap] = useState<Record<string, any>>({});
  const [availableComponents, setAvailableComponents] = useState<
    Record<string, any[]>
  >({});
  const [creatingComponent, setCreatingComponent] = useState<null | {
    type: Slot;
  }>(null);
  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentAttrs, setNewComponentAttrs] = useState<string>("{}");

  useEffect(() => {
    if (open) {
      loadCategories();
      loadAvailableComponents();
      if (product) {
        // Populate form with product data for editing
        let specifications: Record<string, any> = {};

        if (Array.isArray(product.specifications)) {
          // Convert array to object
          product.specifications.forEach((spec: any) => {
            if (spec && typeof spec === "object") {
              const key = spec.name || spec.key;
              if (key) {
                specifications[key] = spec.value;
              }
            }
          });
        } else if (
          product.specifications &&
          typeof product.specifications === "object"
        ) {
          Object.entries(product.specifications).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              specifications[key] = String(value);
            }
          });
        }

        const stock =
          typeof product.inStock === "number"
            ? product.inStock
            : typeof product.inStock === "boolean"
            ? product.inStock
              ? 1
              : 0
            : 0;

        setFormData({
          name: product.name || "",
          slug: product.slug || "",
          description: product.description || "",
          shortDescription: product.shortDescription || "",
          price: product.price || 0,
          originalPrice: product.originalPrice || 0,
          categoryId: product.categoryId || "",
          brand: product.brand || "",
          images: product.images || [],
          specifications,
          stock,
          minimumStock: 0,
          status:
            (product.status as "active" | "inactive" | "draft") || "draft",
          isFeatured: Boolean(product.featured),
          isComponent: !!(
            (product as any)?.specifications?.components &&
            Array.isArray((product as any).specifications.components) &&
            (product as any).specifications.components.length > 0
          ),
          tags: product.tags || [],
        });

        // populate components map if product.specifications.components exists
        try {
          const comps = (product as any)?.specifications?.components;
          const map: Record<string, any> = {};
          if (Array.isArray(comps)) {
            comps.forEach((c: any) => {
              if (c && c.type) map[c.type] = c;
            });
          }
          setComponentsMap(map);
        } catch (e) {
          setComponentsMap({});
        }
      } else {
        // Reset form for new product
        setFormData({
          name: "",
          slug: "",
          description: "",
          shortDescription: "",
          price: 0,
          originalPrice: 0,
          categoryId: "",
          brand: "",
          images: [],
          specifications: {},
          stock: 0,
          minimumStock: 0,
          status: "draft",
          isFeatured: false,
          isComponent: false,
          tags: [],
        });
        setComponentsMap({});
      }
      setError("");
    }
  }, [open, product]);

  // When categories load or category selection changes, auto-detect component categories
  useEffect(() => {
    if (categories && categories.length) {
      const ids: string[] = [];
      const keyword = /linh[\s-]?kiện|component|phụ kiện|accessory/i;
      categories.forEach((category) => {
        if (
          (category.name && keyword.test(String(category.name))) ||
          (category.slug && keyword.test(String(category.slug)))
        ) {
          ids.push(category.id);
        }
      });
      setComponentCategoryIds(ids);
    }
  }, [categories]);

  // Keep isComponent in sync with selected category when appropriate
  useEffect(() => {
    if (formData.categoryId && componentCategoryIds.length) {
      const auto = componentCategoryIds.includes(formData.categoryId);
      if (auto && !formData.isComponent) {
        setFormData((prev) => ({
          ...prev,
          isComponent: true,
        }));
      }
    }
  }, [formData.categoryId, componentCategoryIds, formData.isComponent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Prepare form data
      const formDataToSend = new FormData();

      // Add all product fields to formData
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append(
        "originalPrice",
        (formData.originalPrice || formData.price).toString()
      );
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("brand", formData.brand || "");
      formDataToSend.append("stockQuantity", formData.stock?.toString() || "0");
      formDataToSend.append(
        "inStock",
        (formData.stock ? formData.stock > 0 : false).toString()
      );
      formDataToSend.append(
        "featured",
        (formData.isFeatured || false).toString()
      );
      formDataToSend.append(
        "status",
        formData.status === "draft" ? "inactive" : formData.status
      );

      // Handle JSON fields
      if (formData.specifications) {
        formDataToSend.append(
          "specifications",
          JSON.stringify(formData.specifications)
        );
      }

      if (formData.tags) {
        formDataToSend.append("tags", JSON.stringify(formData.tags));
      }

      // Handle images - separate File objects from existing URL strings
      if (formData.images && formData.images.length > 0) {
        const existingUrls: string[] = [];

        formData.images.forEach((img) => {
          if (img instanceof File) {
            // Append each File directly to FormData with field name "images"
            console.log("📎 Appending file:", img.name, img.size, img.type);
            formDataToSend.append("images", img);
          } else if (typeof img === "string") {
            // Collect existing image URLs
            existingUrls.push(img);
          }
        });

        // Send existing URLs as JSON array
        if (existingUrls.length > 0) {
          console.log("🖼️ Existing images:", existingUrls);
          formDataToSend.append("existingImages", JSON.stringify(existingUrls));
        }
      }

      // Debug: Log all FormData entries
      console.log("📤 FormData entries:");
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      // Send the request using your existing service
      if (product?.id) {
        // For update
        await adminService.products.update(product.id, formDataToSend);
        onSave("Cập nhật sản phẩm thành công");
      } else {
        // For create
        await adminService.products.create(formDataToSend);
        onSave("Tạo sản phẩm thành công");
      }
      onCancel();
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(err.message || "Đã xảy ra lỗi khi lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...files],
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)");
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Kích thước file không được vượt quá 5MB");
          return false;
        }
        return true;
      });

      if (files.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...files],
        }));
      }
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  // Specification change handler (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSpecificationChange = (
    _index: any,
    _field: "name" | "value",
    _value: string
  ) => {
    // Implementation removed as it's not currently used
  };

  const handleComponentChange = (type: string, component: String) => {
    setComponentsMap((prev) => ({
      ...prev,
      [type]: component,
    }));
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        components: {},
      },
    }));
  };

  const loadCategories = async () => {
    try {
      const response = await adminService.categories.getAll();
      let data: any[] = [];
      if (response && typeof response === "object") {
        if (Array.isArray(response)) {
          data = response;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && typeof response.data === "object") {
          data = (response.data as any).data || [];
        }
      }
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  const loadAvailableComponents = async () => {
    try {
      const result: Record<string, any[]> = {};

      for (const t of componentSlots) {
        try {
          //     const res = (await adminService.components.getAll(
          //       t
          //     )) as AxiosResponse<any>;
          //     const responseData = res.data;

          //     if (responseData?.success === false) {
          //       console.warn(
          //         `Failed to load ${t} components:`,
          //         responseData.message
          //       );
          //       result[t] = [];
          //       continue;
          //     }

          //     const data = Array.isArray(responseData)
          //       ? responseData
          //       : (responseData as any)?.data || [];

          //     result[t] = Array.isArray(data) ? data : [];
          //   } catch (error) {
          //     console.error(`Error loading ${t} components:`, error);
          //     result[t] = [];
          //   }
          // }
          if (product) {
            const specs = (product.specifications || {}) as Record<string, any>;
            const comps = Array.isArray(specs.components)
              ? specs.components
              : [];
            const updatedMap: Record<string, any> = {};

            comps.forEach((comp: any) => {
              if (comp?.type) {
                updatedMap[comp.type] = { id: comp.id };
              }
            });

            setComponentsMap(updatedMap);
          }
        } catch (error) {
          console.error("Error loading components:", error);
        }
      }

      setAvailableComponents(result);

      // Handle existing product components
      if (product) {
        setComponentsMap((prev) => {
          const updated = { ...prev };
          const specs = (product.specifications || {}) as {
            components?: Array<{ type: string; id: string }>;
          };
          const comps = specs?.components || [];

          comps.forEach((comp) => {
            if (comp?.type && !updated[comp.type]?.id && comp.id) {
              updated[comp.type] = { id: comp.id };
            }
          });

          return updated;
        });
      }
    } catch (error) {
      console.error("Error in loadAvailableComponents:", error);
      setAvailableComponents({});
    }
  };

  // Helper function to generate URL-friendly slugs
  const generateSlug = (str: string): string => {
    if (!str) return "";
    return str
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddSpec = () => {
    if (specInput.name.trim() && specInput.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specInput.name.trim()]: specInput.value.trim(),
        },
      }));
      setSpecInput({ name: "", value: "" });
    }
  };

  const handleRemoveSpec = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs,
      };
    });
  };

  const handleGenerateSlug = () => {
    if (formData.name) {
      const slug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
        setTagInput("");
      }
    }
  };

  const handleCreateComponent = async () => {
    if (!creatingComponent || !newComponentName.trim()) {
      setError("Vui lòng nhập tên component");
      return;
    }

    try {
      const attributes = newComponentAttrs ? JSON.parse(newComponentAttrs) : {};
      const newComponent = {
        name: newComponentName.trim(),
        type: creatingComponent.type,
        attributes,
      };

      const response = await adminService.components.create(newComponent);
      await loadAvailableComponents();

      setComponentsMap((prev) => ({
        ...prev,
        [creatingComponent.type]: response.data,
      }));

      setCreatingComponent(null);
      setNewComponentName("");
      setNewComponentAttrs("{}");
      setError("");
    } catch (error) {
      console.error("Error creating component:", error);
      setError("Có lỗi xảy ra khi tạo component");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {product ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm Mới"}
          </Typography>
          <IconButton onClick={onCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    required
                    label="Tên sản phẩm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    sx={{ flex: "1 1 300px" }}
                  />

                  <TextField
                    label="Slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    sx={{ flex: "1 1 200px" }}
                    InputProps={{
                      endAdornment: (
                        <Button onClick={handleGenerateSlug} size="small">
                          Tạo tự động
                        </Button>
                      ),
                    }}
                  />
                </Box>

                <TextField
                  required
                  multiline
                  rows={3}
                  label="Mô tả chi tiết"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  fullWidth
                />

                <TextField
                  multiline
                  rows={2}
                  label="Mô tả ngắn"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>
            </Box>

            {/* Images */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Hình ảnh sản phẩm
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ width: "100%", mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {formData.images.length > 0
                    ? "Hình ảnh đã chọn"
                    : "Chưa có hình ảnh"}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={saving}
                  sx={{ mb: 2 }}
                >
                  {formData.images.length > 0 ? "Thêm ảnh khác" : "Tải ảnh lên"}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>

                {/* Show selected images */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  {/* In the image preview section of ProductForm.tsx */}
                  {formData.images.map((img, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        width: 100,
                        height: 100,
                        margin: 1,
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          img instanceof File
                            ? URL.createObjectURL(img)
                            : img.startsWith("http") || img.startsWith("//")
                            ? img
                            : `${(
                                import.meta.env.VITE_API_URL ||
                                "http://localhost:5000"
                              ).replace(/\/api$/, "")}${
                                img.startsWith("/") ? "" : "/"
                              }${img}`
                        }
                        alt={`Preview ${index}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "rgba(255,255,255,0.8)",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,1)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Pricing & Inventory */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Giá & Tồn kho
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  required
                  type="number"
                  label="Giá bán"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: "1 1 200px" }}
                  InputProps={{
                    inputProps: { min: 0, step: 1000 },
                  }}
                />
                <TextField
                  type="number"
                  label="Giá gốc"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      originalPrice: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: "1 1 200px" }}
                  InputProps={{
                    inputProps: { min: 0, step: 1000 },
                  }}
                />
                <TextField
                  required
                  type="number"
                  label="Tồn kho"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stock: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: "1 1 200px" }}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </Box>
            </Box>

            {/* Category & Brand */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Phân loại
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  required
                  label="Danh mục"
                  select
                  value={formData.categoryId || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  sx={{ flex: "1 1 300px" }}
                >
                  <MenuItem value="">Chọn danh mục</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  required
                  label="Thương hiệu"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  sx={{ flex: "1 1 300px" }}
                />
              </Box>
            </Box>

            {/* Specifications */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông số kỹ thuật
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                {Object.entries(formData.specifications || {}).map(
                  ([key, value]) => (
                    <Box
                      key={key}
                      sx={{ display: "flex", gap: 1, alignItems: "center" }}
                    >
                      <TextField
                        value={key}
                        label="Tên thông số"
                        size="small"
                        disabled
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        value={value}
                        label="Giá trị"
                        size="small"
                        disabled
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveSpec(key)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )
                )}

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    value={specInput.name}
                    onChange={(e) =>
                      setSpecInput((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    label="Tên thông số"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    value={specInput.value}
                    onChange={(e) =>
                      setSpecInput((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    label="Giá trị"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddSpec}
                    variant="outlined"
                  >
                    Thêm
                  </Button>
                </Box>
              </Stack>
            </Box>

            {/* Components / Linh kiện - only shown for component products */}
            {formData.isComponent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Linh kiện (Components)
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2}>
                  {componentSlots.map((slot) => (
                    <Box
                      key={slot}
                      sx={{ display: "flex", gap: 1, alignItems: "center" }}
                    >
                      <TextField
                        select
                        size="small"
                        label={slot}
                        value={(componentsMap as any)[slot]?.id || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) {
                            handleComponentChange(slot as any, "");
                          } else {
                            handleComponentChange(slot as any, id);
                          }
                        }}
                        sx={{ flex: 1 }}
                      >
                        <MenuItem value="">Chọn {slot}</MenuItem>
                        {((availableComponents as any)[slot] || []).map(
                          (c: any) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          )
                        )}
                      </TextField>
                      <Button
                        size="small"
                        onClick={() =>
                          setCreatingComponent({ type: slot as any })
                        }
                      >
                        Thêm mới
                      </Button>
                      {componentsMap[slot] && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleComponentChange(slot as any, "")}
                        >
                          Xóa
                        </Button>
                      )}
                    </Box>
                  ))}

                  {creatingComponent && (
                    <Box
                      sx={{ border: "1px dashed #ccc", p: 2, borderRadius: 1 }}
                    >
                      <Typography variant="subtitle2">
                        Thêm linh kiện mới: {creatingComponent.type}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <TextField
                          label="Tên"
                          value={newComponentName}
                          onChange={(e) => setNewComponentName(e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Attributes (JSON)"
                          value={newComponentAttrs}
                          onChange={(e) => setNewComponentAttrs(e.target.value)}
                          sx={{ flex: 2 }}
                        />
                        <Button
                          onClick={handleCreateComponent}
                          variant="contained"
                        >
                          Tạo
                        </Button>
                        <Button onClick={() => setCreatingComponent(null)}>
                          Hủy
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Tags */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}
                >
                  <TextField
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Thêm tag"
                    size="small"
                    sx={{ flex: 1, maxWidth: "300px" }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outlined"
                    size="small"
                  >
                    Thêm
                  </Button>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* Settings */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Cài đặt
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {/* In your form's JSX where the status select is defined: */}
                <TextField
                  label="Trạng thái"
                  select
                  value={
                    formData.status === "draft" ? "inactive" : formData.status
                  } // Convert 'draft' to 'inactive'
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as "active" | "inactive",
                    }))
                  }
                  sx={{ minWidth: "200px" }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Sản phẩm nổi bật"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formData.isComponent)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isComponent: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Xử lý như linh kiện (Component)"
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCancel} disabled={saving}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {product ? "Cập nhật" : "Tạo"} Sản phẩm
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductForm;

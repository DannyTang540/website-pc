// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from "@mui/material";
import type { Category } from "../../../types/category";
import { adminService } from "../../../services/adminService";

interface CategoryFormProps {
  open: boolean;
  category?: Category | null;
  onSave: (category: Category) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  category,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    status: "active" as "active" | "inactive",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      loadCategories();
      if (category) {
        setFormData({
          name: category.name,
          description: category.description || "",
          parentId: category.parentId || "",
          status: category.status ?? "active",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          parentId: "",
          status: "active",
        });
      }
      setError("");
    }
  }, [open, category]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.categories.getAll();
      // Backend may return either an array or a wrapped payload: { success, data }
      const payload: any = response?.data;
      const data = Array.isArray(payload) ? payload : payload?.data;

      const categoriesData: Category[] = Array.isArray(data)
        ? data
            .map((cat: any) => {
              const id = cat?.id ?? cat?._id;
              if (!id) return null;
              return {
                id: String(id),
                name: cat?.name ?? "",
                description: cat?.description ?? "",
                parentId: cat?.parentId ?? cat?.parent_id ?? null,
                status: cat?.status ?? "active",
                subcategories: cat?.subcategories ?? [],
              } as Category;
            })
            .filter(Boolean)
        : [];

      console.log("Loaded categories:", categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Không thể tải danh sách danh mục");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) =>
    text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let savedCategory: Category;

      if (category?.id) {
        const response = await adminService.categories.update(category.id, {
          ...formData,
          parentId: formData.parentId || "",
        });
        savedCategory = response.data;
      } else {
        const payload = {
          ...formData,
          slug: generateSlug(formData.name),
          parentId: formData.parentId || "",
        };
        const response = await adminService.categories.create(payload);
        savedCategory = response.data;
      }

      onSave(savedCategory);
    } catch (error: any) {
      setError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Define type for dropdown options with proper indentation
  type Option = {
    id: string;
    name: string;
    depth: number;
    parentId: string | null;
  };

  // Build a map of parent IDs to their children for efficient tree traversal
  const buildCategoryTree = (
    cats: Category[]
  ): Map<string | null, Category[]> => {
    const map = new Map<string | null, Category[]>();
    // Initialize with all possible parent IDs (including null for root categories)
    map.set(null, []);
    cats.forEach((cat) => {
      if (!map.has(cat.id)) {
        map.set(cat.id, []);
      }
    });

    // Build the tree structure
    cats.forEach((cat) => {
      const parentId = cat.parentId || null;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)?.push(cat);
    });

    return map;
  };

  // Flatten the category tree for display in the dropdown
  const flattenCategoryTree = (
    tree: Map<string | null, Category[]>,
    rootId: string | null = null,
    depth: number = 0
  ): Option[] => {
    const result: Option[] = [];
    const children = tree.get(rootId) || [];

    // Sort categories alphabetically
    const sortedChildren = [...children].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const category of sortedChildren) {
      result.push({
        id: category.id,
        name: category.name,
        depth,
        parentId: category.parentId || null,
      });

      // Recursively add children
      const childCategories = flattenCategoryTree(tree, category.id, depth + 1);
      result.push(...childCategories);
    }

    return result;
  };

  // Get all descendant category IDs to prevent circular references
  const getAllDescendantIds = (categoryId: string): Set<string> => {
    const result = new Set<string>();
    const stack = [categoryId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      const children = categories.filter((cat) => cat.parentId === currentId);
      for (const child of children) {
        if (!result.has(child.id)) {
          result.add(child.id);
          stack.push(child.id);
        }
      }
    }

    return result;
  };

  // Generate flattened options for the dropdown
  const flattenedOptions = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];

    const categoryTree = buildCategoryTree(categories);
    return flattenCategoryTree(categoryTree);
  }, [categories]);

  // Get IDs of all descendants of the current category (to disable them in the dropdown)
  const descendantIds = useMemo(() => {
    if (!category?.id) return new Set<string>();
    return getAllDescendantIds(category.id);
  }, [category, categories]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? "Sửa danh mục" : "Thêm danh mục mới"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Tên danh mục"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Danh mục cha</InputLabel>
              <Select
                value={formData.parentId}
                label="Danh mục cha"
                onChange={(e) => handleChange("parentId", e.target.value)}
              >
                <MenuItem value="">Không có (Danh mục gốc)</MenuItem>
                {flattenedOptions.map((opt) => {
                  const disabled =
                    opt.id === category?.id || descendantIds.has(opt.id);
                  const indent = Array(opt.depth)
                    .fill("\u00A0\u00A0\u00A0")
                    .join("");
                  return (
                    <MenuItem key={opt.id} value={opt.id} disabled={disabled}>
                      <span style={{ whiteSpace: "pre" }}>
                        {indent + opt.name}
                      </span>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                label="Trạng thái"
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Ẩn</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? "Đang lưu..." : category ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryForm;

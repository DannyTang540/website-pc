import { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

interface FilterProps {
  categories: any[];
  brands: string[];
  onFilterChange: (filters: any) => void;
}

const ProductFilter: React.FC<FilterProps> = ({
  categories,
  brands,
  onFilterChange,
}) => {
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000000]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const applyFilters = () => {
    onFilterChange({
      priceRange,
      categories: selectedCategories,
      brands: selectedBrands,
    });
  };

  const resetFilters = () => {
    setPriceRange([0, 50000000]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    onFilterChange({});
  };

  return (
    <Box sx={{ width: 280, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Bộ lọc
      </Typography>

      {/* Price Filter */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Khoảng giá</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${(value / 1000000).toFixed(0)}tr`}
            min={0}
            max={50000000}
            step={1000000}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2">
              {(priceRange[0] / 1000000).toFixed(0)}tr
            </Typography>
            <Typography variant="body2">
              {(priceRange[1] / 1000000).toFixed(0)}tr
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Category Filter */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Danh mục</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {categories.map((category) => (
            <FormControlLabel
              key={category.id}
              control={
                <Checkbox
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                />
              }
              label={category.name}
            />
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Brand Filter */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Thương hiệu</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {brands.map((brand) => (
            <FormControlLabel
              key={brand}
              control={
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                />
              }
              label={brand}
            />
          ))}
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={applyFilters} fullWidth>
          Áp dụng
        </Button>
        <Button variant="outlined" onClick={resetFilters} fullWidth>
          Đặt lại
        </Button>
      </Box>
    </Box>
  );
};

export default ProductFilter;

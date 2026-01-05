import { useState } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { TextField, InputAdornment, Box } from '@mui/material';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Tìm kiếm sản phẩm..." }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    setSearchQuery(query);
    onSearch(normalizedQuery);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'white',
          }
        }}
      />
    </Box>
  );
};

export default SearchBar;
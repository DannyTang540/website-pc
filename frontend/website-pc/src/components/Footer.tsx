import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
} from '@mui/material';
import { Facebook, Twitter, Instagram, YouTube } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        py: 6,
        mt: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* Thay thế Grid container bằng Flexbox */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          flexWrap: 'wrap'
        }}>
          {/* Company Info */}
          <Box sx={{ 
            width: { xs: '100%', md: 'calc(33.333% - 32px)' },
            minWidth: { md: '300px' }
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              PC STORE
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Chuyên cung cấp PC Gaming, Workstation và linh kiện máy tính chất lượng cao với giá tốt nhất thị trường.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <YouTube />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Links */}
          <Box sx={{ 
            width: { xs: '100%', sm: 'calc(50% - 32px)', md: 'calc(16.666% - 32px)' },
            minWidth: { xs: '200px' }
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Sản phẩm
            </Typography>
            <Link href="/products?category=PC Gaming" color="inherit" display="block" sx={{ mb: 1 }}>
              PC Gaming
            </Link>
            <Link href="/products?category=PC Workstation" color="inherit" display="block" sx={{ mb: 1 }}>
              PC Workstation
            </Link>
            <Link href="/products?category=Linh Kiện PC" color="inherit" display="block" sx={{ mb: 1 }}>
              Linh Kiện PC
            </Link>
            <Link href="/products?category=Màn Hình" color="inherit" display="block" sx={{ mb: 1 }}>
              Màn Hình
            </Link>
          </Box>

          {/* Support */}
          <Box sx={{ 
            width: { xs: '100%', sm: 'calc(50% - 32px)', md: 'calc(25% - 32px)' },
            minWidth: { xs: '250px' }
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Hỗ trợ
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📞 Hotline: 0386.165.820
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📧 Email: support@pcstore.com
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🕒 Giờ làm việc: 8:00 - 22:00
            </Typography>
            <Typography variant="body2">
              Địa chỉ: 123 Nguyễn Trãi, Q.5, TP.HCM
            </Typography>
          </Box>

          {/* Policies */}
          <Box sx={{ 
            width: { xs: '100%', sm: 'calc(50% - 32px)', md: 'calc(25% - 32px)' },
            minWidth: { xs: '200px' }
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Chính sách
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Chính sách bảo hành
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Chính sách đổi trả
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Chính sách vận chuyển
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Hướng dẫn mua hàng
            </Link>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 4,
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            © 2024 PC Store. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
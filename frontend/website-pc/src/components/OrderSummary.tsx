import { Box, Typography, Divider, List, ListItem } from '@mui/material';

interface OrderSummaryProps {
  items: any[];
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, total }) => {
  return (
    <Box sx={{ 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 1, 
      p: 2,
      position: 'sticky',
      top: 100
    }}>
      <Typography variant="h6" gutterBottom>
        Tóm tắt đơn hàng
      </Typography>
      
      <List sx={{ mb: 2 }}>
        {items.map((item) => (
          <ListItem 
            key={item.id} 
            sx={{ 
              px: 0,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.quantity} × {item.price.toLocaleString()} VND
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {(item.price * item.quantity).toLocaleString()} VND
            </Typography>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Tạm tính:</Typography>
        <Typography>{total.toLocaleString()} VND</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Phí vận chuyển:</Typography>
        <Typography>0 VND</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Giảm giá:</Typography>
        <Typography>0 VND</Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Tổng cộng:</Typography>
        <Typography variant="h6" color="primary">
          {total.toLocaleString()} VND
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderSummary;
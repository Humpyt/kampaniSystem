import React, { useState, useEffect } from 'react';
import { Box, Grid, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SalesItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_path?: string;
}

interface CartItem {
  quantity: number;
  item: SalesItem;
}

const CategoryButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '60px',
  backgroundColor: '#8FA093',
  color: 'white',
  '&:hover': {
    backgroundColor: '#7A8A7D',
  },
  textTransform: 'none',
  fontSize: '16px',
}));

const ItemButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '120px',
  backgroundColor: '#FFFFD4',
  color: 'black',
  '&:hover': {
    backgroundColor: '#FFFFE4',
  },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px',
  border: '1px solid #ccc',
  '& .MuiTypography-body1': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    marginTop: '4px'
  }
}));

const DiscountButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '50px',
  backgroundColor: '#C4A484',
  color: 'white',
  '&:hover': {
    backgroundColor: '#B39474',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '50px',
  backgroundColor: '#2E5090',
  color: 'white',
  '&:hover': {
    backgroundColor: '#1E4080',
  },
  marginBottom: '10px',
}));

export default function SalesItems() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<SalesItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Fetch categories and items from your API
    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales-categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales-items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemClick = (item: SalesItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { quantity: 1, item }];
    });
    updateTotals();
  };

  const updateTotals = () => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.item.price), 0);
    const newTax = newSubtotal * 0.07; // 7% tax rate
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', p: 2 }}>
      <Box sx={{ flex: 3, mr: 2 }}>
        {/* Categories Grid */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {categories.map((category) => (
            <Grid item xs={3} key={category.id}>
              <CategoryButton
                onClick={() => handleCategoryClick(category.id)}
                variant="contained"
              >
                {category.name}
              </CategoryButton>
            </Grid>
          ))}
        </Grid>

        {/* Items Grid */}
        <Grid container spacing={1}>
          {items
            .filter(item => !selectedCategory || item.category_id === selectedCategory)
            .map((item) => (
              <Grid item xs={3} key={item.id}>
                <ItemButton onClick={() => handleItemClick(item)}>
                  {item.image_path && (
                    <img
                      src={item.image_path}
                      alt={item.name}
                      style={{ maxHeight: '60px', marginBottom: '5px' }}
                    />
                  )}
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="body1">${item.price.toFixed(2)}</Typography>
                </ItemButton>
              </Grid>
            ))}
        </Grid>
      </Box>

      <Box sx={{ flex: 1 }}>
        {/* Cart and Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ mb: 2 }}>
            {cart.map((cartItem) => (
              <Box key={cartItem.item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>{cartItem.quantity}x {cartItem.item.name}</Typography>
                <Typography>${(cartItem.quantity * cartItem.item.price).toFixed(2)}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ borderTop: '1px solid #ccc', pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Subtotal:</Typography>
              <Typography>${subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Tax:</Typography>
              <Typography>${tax.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Total:</Typography>
              <Typography>${total.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Paper>

        <ActionButton variant="contained">Quantity</ActionButton>
        <ActionButton variant="contained">Delete</ActionButton>
        <ActionButton variant="contained" color="error">Discount</ActionButton>

        {/* Discount Buttons */}
        <Grid container spacing={1} sx={{ mt: 2 }}>
          {['-$1.00', '$1.00', '$3.00', '$5.00', '$10.00', '$20.00'].map((amount) => (
            <Grid item xs={4} key={amount}>
              <DiscountButton variant="contained">
                {amount}
              </DiscountButton>
            </Grid>
          ))}
          <Grid item xs={4}>
            <DiscountButton variant="contained">
              Adjust Price
            </DiscountButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

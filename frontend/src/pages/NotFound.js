import React from 'react';
import { Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ textAlign: 'center', marginTop: 10 }}>
      <Typography variant="h3" gutterBottom>404 - Page Not Found</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Go to Login</Button>
    </Container>
  );
};

export default NotFound;


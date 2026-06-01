import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  InputAdornment, IconButton, Stack, Divider,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, LocalPharmacy,
} from '@mui/icons-material';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, error } = useAuth();
  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const path = user.role === 'storeOwner' ? '/store' : user.role === 'admin' ? '/admin' : '/patient';
      navigate(path, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.emailOrPhone || !form.password) return toast.error('Please fill in all fields.');
    dispatch(loginUser(form));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 440, width: '100%', p: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 2,
              bgcolor: '#0d9488', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>P</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              pharma<span style={{ color: '#0d9488' }}>Assist</span>
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue to your dashboard
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email or Phone"
                type="text"
                fullWidth
                size="small"
                value={form.emailOrPhone}
                onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                placeholder="you@example.com or 01XXXXXXXXX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                size="small"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>
              Create one
            </Link>
          </Typography>

          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
            <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Back to home
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
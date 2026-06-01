import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CATEGORY_ICONS } from '../../utils/constants';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  TextField, InputAdornment, Chip, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Search, Edit, Delete, Warning, Inventory2, FilterList,
  Add, Remove, LocalPharmacy, ShoppingCart,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory/my-store');
      setItems(data.data.inventory || []);
    } catch (err) {
      console.error('Failed to load inventory:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/${deleteId}`);
      toast.success('Item removed');
      setDeleteId(null);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = items.filter(item => {
    const name = item.medicine?.brandName || item.medicine?.name || '';
    const generic = item.medicine?.genericName || '';
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || generic.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    if (filter === 'low') return matchSearch && item.stockQuantity <= 5 && item.stockQuantity > 0;
    if (filter === 'out') return matchSearch && item.stockQuantity === 0;
    if (filter === 'expired') return matchSearch && new Date(item.expiryDate) < new Date();
    return matchSearch;
  });

  const getStockStatus = (item) => {
    if (item.stockQuantity === 0) return { label: 'Out of Stock', color: 'error' };
    if (item.stockQuantity <= 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Manage your stock</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} component={Link} to="/store/add-medicine">
          Add Medicine
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 6, textAlign: 'center' }}>
          <Inventory2 sx={{ fontSize: 48, color: '#e5e7eb' }} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>No items found</Typography>
        </Card>
      ) : (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Medicine</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Quantity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Expiry</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const med = item.medicine || {};
                  const status = getStockStatus(item);
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {med.brandName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {med.genericName}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Chip label={med.category || 'N/A'} size="small" />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.stockQuantity}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Typography variant="body2">
                          {item.sellingPrice?.toLocaleString()}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Chip label={status.label} color={status.color} size="small" />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Typography variant="caption" color="text.secondary">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : 'N/A'}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton size="small" component={Link} to={`/store/inventory/${item._id}/edit`}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteId(item._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Card>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Remove Item?</DialogTitle>
        <DialogContent>
          <Typography>This will remove the item from your inventory.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField,
  Grid, Button, Stack, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Receipt, Download, Search, LocalPharmacy,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailsBill, setDetailsBill] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get('/bills/my-purchases');
      setPurchases(data.data.purchases || []);
    } catch (err) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter(p =>
    p.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.store?.pharmacyName?.toLowerCase().includes(search.toLowerCase())
  );

  const downloadPDF = async (billId) => {
    try {
      const response = await api.get(`/bills/${billId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Purchase History</Typography>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search by bill number or pharmacy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}><Search /></Box>,
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 6, textAlign: 'center' }}>
          <Receipt sx={{ fontSize: 64, color: '#e5e7eb' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>No purchases yet</Typography>
          <Typography variant="body2" color="text.secondary">Your purchase history will appear here.</Typography>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Bill #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pharmacy</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <Typography sx={{ fontFamily: 'monospace', color: '#0d9488' }}>
                        {p.billNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.store?.pharmacyName || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(p.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600 }}>{formatCurrency(p.grandTotal)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" onClick={() => setDetailsBill(p)}>View</Button>
                        <IconButton size="small" onClick={() => downloadPDF(p._id)}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={!!detailsBill} onClose={() => setDetailsBill(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bill Details - {detailsBill?.billNumber}</DialogTitle>
        <DialogContent>
          {detailsBill?.items?.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
              <Typography variant="body2">
                {item.medicine?.brandName || item.medicineName || 'Medicine'} x{item.quantity}
              </Typography>
              <Typography variant="body2">{formatCurrency(item.lineTotal)}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, fontWeight: 700 }}>
            <Typography>Total</Typography>
            <Typography>{formatCurrency(detailsBill?.grandTotal)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsBill(null)}>Close</Button>
          <Button variant="contained" startIcon={<Download />} onClick={() => downloadPDF(detailsBill?._id)}>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
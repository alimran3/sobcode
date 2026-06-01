import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Box, Container, Typography, Card, CardContent, TextField,
  Grid, Button, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, IconButton, Divider, Alert,
} from '@mui/material';
import {
  Add, Search, Delete, Remove, Person, Receipt, Download,
  LocalPharmacy, Info, Warning, Error as ErrorIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

export default function BillCreation() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [walkIn, setWalkIn] = useState({ name: '', phone: '' });
  const [useWalkIn, setUseWalkIn] = useState(false);

  const [medSearch, setMedSearch] = useState('');
  const [inventoryResults, setInventoryResults] = useState([]);
  const [billItems, setBillItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [conflictWarnings, setConflictWarnings] = useState([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  useEffect(() => {
    if (medSearch.length < 2) { setInventoryResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/inventory/my-store', { params: { search: medSearch, limit: 10 } });
        setInventoryResults(data.data.inventory.filter((i) => i.status === 'active' && i.stockQuantity > 0));
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [medSearch]);

  useEffect(() => {
    if (patientSearch.length < 3) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/patients/search', { params: { q: patientSearch } });
        setPatientResults(data.data.patients);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const selectPatient = (p) => {
    setPatient(p);
    setPatientSearch('');
    setPatientResults([]);
    setUseWalkIn(false);
    toast.success(`Patient linked: ${p.fullName}`);
  };

  const addItem = (invItem) => {
    const exists = billItems.find((b) => b.inventoryItemId === invItem._id);
    if (exists) {
      if (exists.quantity >= invItem.stockQuantity) return toast.error('Max stock reached.');
      setBillItems(billItems.map((b) =>
        b.inventoryItemId === invItem._id ? { ...b, quantity: b.quantity + 1 } : b
      ));
    } else {
      setBillItems([...billItems, {
        inventoryItemId: invItem._id,
        medicine: invItem.medicine,
        medicineName: invItem.medicine?.brandName || '',
        strength: invItem.medicine?.strength || '',
        unitPrice: invItem.sellingPrice,
        discountOverride: invItem.discountPercentage || 0,
        quantity: 1,
        maxStock: invItem.stockQuantity,
        imageUrl: invItem.imageUrl || invItem.medicine?.imageUrl,
      }]);
    }
    setMedSearch('');
    setInventoryResults([]);
  };

  const updateQuantity = (idx, delta) => {
    setBillItems(billItems.map((item, i) => {
      if (i !== idx) return item;
      const newQty = item.quantity + delta;
      if (newQty < 1 || newQty > item.maxStock) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const removeItem = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
    setConflictWarnings([]);
  };

  const subtotal = billItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = billItems.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity * (item.discountOverride / 100));
  }, 0);
  const grandTotal = subtotal - totalDiscount;

  const checkConflicts = async () => {
    if (!patient || billItems.length === 0) return { warnings: [], hasConflicts: false };

    try {
      const { data } = await api.post('/bills/check-conflicts', {
        patientId: patient._id,
        items: billItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
        })),
      });
      return data.data;
    } catch (err) {
      console.error('Conflict check failed:', err);
      return { warnings: [], hasConflicts: false };
    }
  };

  const handleCheckConflicts = async () => {
    const result = await checkConflicts();
    if (result.hasConflicts) {
      setConflictWarnings(result.warnings);
      setShowConflictDialog(true);
    } else {
      toast.success('No conflicts detected. Safe to proceed.');
    }
  };

  const handleSubmit = async () => {
    if (billItems.length === 0) return toast.error('Add at least one medicine.');

    setLoading(true);
    try {
      const payload = {
        items: billItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          discountOverride: item.discountOverride,
        })),
        paymentMethod,
        notes,
      };

      if (patient) {
        payload.patientId = patient._id;
      } else if (useWalkIn && walkIn.name) {
        payload.walkInCustomer = walkIn;
      }

      const { data } = await api.post('/bills', payload);
      setGeneratedBill(data.data.bill);
      setConflictWarnings([]);
      toast.success(`Bill ${data.data.bill.billNumber} created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill.');
    } finally {
      setLoading(false);
    }
  };

  if (generatedBill) {
    const downloadPDF = async () => {
      try {
        const response = await api.get(`/bills/${generatedBill._id}/pdf`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${generatedBill.billNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        toast.error('Failed to download PDF');
      }
    };

    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 2,
            bgcolor: '#0d9488', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3
          }}>
            <Receipt sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Bill Created!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {generatedBill.billNumber}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#0d9488', mt: 2 }}>
            {formatCurrency(generatedBill.grandTotal)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {generatedBill.items.length} items · {generatedBill.paymentMethod}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={() => navigate('/store')}>
              Dashboard
            </Button>
            <Button variant="contained" startIcon={<Download />} onClick={downloadPDF}>
              Download PDF
            </Button>
            <Button variant="contained" color="success" startIcon={<Add />}
              onClick={() => { setGeneratedBill(null); setBillItems([]); setPatient(null); }}>
              New Bill
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Fragment>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Create Bill</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person sx={{ color: '#0d9488' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Link Patient</Typography>
                <Typography variant="caption" color="text.secondary">(Optional)</Typography>
              </Box>

              {patient ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#f0fdfa', borderRadius: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{patient.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{patient.phone}</Typography>
                    {patient.allergies?.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {patient.allergies.map((a, i) => (
                          <Chip key={i} label={`Allergy: ${a.name}`} size="small" color="error" />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Button size="small" color="error" onClick={() => setPatient(null)}>Remove</Button>
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth size="small"
                    placeholder="Search patient by name or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    }}
                  />
                  {patientResults.length > 0 && createPortal(
                    <Paper sx={{ position: 'fixed', top: '25%', left: '50%', transform: 'translateX(-50%)', width: '500px', maxWidth: '90vw', zIndex: 99999 }}>
                      {patientResults.map((p) => (
                        <Box key={p._id} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                          onClick={() => selectPatient(p)}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.phone}</Typography>
                        </Box>
                      ))}
                    </Paper>,
                    document.body
                  )}
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                      <input type="checkbox" checked={useWalkIn}
                        onChange={(e) => setUseWalkIn(e.target.checked)} />
                      <Typography variant="body2">Walk-in customer</Typography>
                    </Box>
                    {useWalkIn && (
                      <TextField size="small" placeholder="Name"
                        value={walkIn.name} onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })} />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

<Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalPharmacy sx={{ color: '#0d9488' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Add Medicines</Typography>
              </Box>

              <TextField
                fullWidth size="small"
                placeholder="Search your inventory..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                }}
              />

              {inventoryResults.length > 0 && createPortal(
                <Paper sx={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '500px', maxWidth: '90vw', zIndex: 99999 }}>
                  <Box sx={{ p: 1, borderBottom: '1px solid #eee', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" color="text.secondary">{inventoryResults.length} item(s) found</Typography>
                  </Box>
                  {inventoryResults.map((inv) => (
                    <Box key={inv._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                      onClick={() => addItem(inv)}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {inv.medicine?.brandName} {inv.medicine?.strength}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {inv.stockQuantity} · {formatCurrency(inv.sellingPrice)}
                        </Typography>
                      </Box>
                      <Add sx={{ color: '#0d9488' }} />
                    </Box>
                  ))}
                </Paper>,
                document.body
              )}

              {billItems.length > 0 && (
                <TableContainer sx={{ mt: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.medicineName} {item.strength}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => updateQuantity(idx, -1)}>
                              <Remove fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" component="span" sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton size="small" onClick={() => updateQuantity(idx, 1)}>
                              <Add fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeItem(idx)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Bill Summary</Typography>

              {billItems.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 48, color: '#e5e7eb' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No items added yet
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    {billItems.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.medicineName} x{item.quantity}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                  </Box>
                  {totalDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                      <Typography variant="body2">Discount</Typography>
                      <Typography variant="body2">-{formatCurrency(totalDiscount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d9488' }}>
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </Box>

                  <TextField select label="Payment Method" fullWidth size="small" sx={{ mt: 3 }}
                    value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {['Cash', 'bKash', 'Nagad', 'Card'].map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>

                  <TextField label="Notes" multiline rows={2} fullWidth size="small" sx={{ mt: 2 }}
                    value={notes} onChange={(e) => setNotes(e.target.value)} />

                  {patient && billItems.length > 0 && (
                    <Button variant="outlined" color="warning" fullWidth size="small" sx={{ mt: 2 }}
                      onClick={handleCheckConflicts} startIcon={<Warning />}>
                      Check Drug Conflicts
                    </Button>
                  )}

                  <Button variant="contained" fullWidth size="large" sx={{ mt: 2 }}
                    onClick={handleSubmit} disabled={loading} startIcon={<Receipt />}>
                    {loading ? 'Generating...' : 'Generate Bill'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>

    <Dialog open={showConflictDialog} onClose={() => setShowConflictDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning sx={{ color: '#f59e0b' }} />
        Drug Conflict Warnings
      </DialogTitle>
      <DialogContent dividers>
        {conflictWarnings.map((item, idx) => (
          <Box key={idx} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1f2937' }}>
              {item.medicineName}
            </Typography>
            {item.warnings.map((warning, wIdx) => (
              <Alert
                key={wIdx}
                severity={warning.severity === 'red' ? 'error' : 'warning'}
                icon={warning.severity === 'red' ? <ErrorIcon fontSize="inherit" /> : <Warning fontSize="inherit" />}
                sx={{ mb: 1 }}
              >
                {warning.message}
              </Alert>
            ))}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setShowConflictDialog(false)} variant="outlined">
          Cancel Sale
        </Button>
        <Button onClick={() => { setShowConflictDialog(false); handleSubmit(); }} variant="contained" color="warning">
          Proceed Anyway
        </Button>
      </DialogActions>
    </Dialog>
    </Fragment>
  );
}
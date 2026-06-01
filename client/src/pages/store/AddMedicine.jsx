import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Stack, Grid as MuiGrid,
  Chip, CircularProgress, InputAdornment, IconButton, Typography, Paper,
} from '@mui/material';
import { Search, Close, ArrowBack, Add, Remove, Check } from '@mui/icons-material';
import { formatCurrency, getMedicineImage } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

export default function AddMedicine() {
  const navigate = useNavigate();
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [suggestedMedicines, setSuggestedMedicines] = useState([]);
  const [browseMedicines, setBrowseMedicines] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browsePages, setBrowsePages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const [form, setForm] = useState({
    batchNumber: '',
    buyingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    buyingPrice: '',
    sellingPrice: '',
    discountPercentage: 0,
    stockQuantity: '',
    imageUrl: '',
    notes: '',
  });

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  useEffect(() => {
    const fetchBrowse = async () => {
      setBrowseLoading(true);
      try {
        const { data } = await api.get('/medicines/search', { params: { page: browsePage, limit: 60 } });
        const meds = data.data.medicines || [];
        const seen = new Set();
        setBrowseMedicines(meds.filter((m) => { if (seen.has(m._id)) return false; seen.add(m._id); return true; }));
        setBrowsePages(data.data.pagination?.pages || 1);
      } catch (err) {
        toast.error('Failed to load medicines.');
      } finally {
        setBrowseLoading(false);
      }
    };
    fetchBrowse();
  }, [browsePage]);

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/medicines/search', { params: { q: query, limit: 20 } });
      const results = data.data.medicines || [];
      const seen = new Set();
      const unique = results.filter((m) => {
        if (seen.has(m._id)) return false;
        seen.add(m._id);
        return true;
      });
      setSearchResults(unique);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), 300);
  };

  const handleSelect = (medicine) => {
    setSelectedMedicine(medicine);
    setSearchValue('');
    setSearchResults([]);
    setShowResults(false);
    setWarnings([]);
    setForm({
      batchNumber: '',
      buyingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      buyingPrice: '',
      sellingPrice: medicine.standardMrp || '',
      discountPercentage: 0,
      stockQuantity: '',
      imageUrl: '',
      notes: '',
    });
  };

  const handleReset = () => {
    setSelectedMedicine(null);
    setSearchValue('');
    setSearchResults([]);
    setShowResults(false);
    setWarnings([]);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validate = () => {
    if (!form.expiryDate) { toast.error('Expiry date is required.'); return false; }
    if (new Date(form.expiryDate) <= new Date()) { toast.error('Expiry date must be in the future.'); return false; }
    if (!form.buyingPrice || parseFloat(form.buyingPrice) < 0) { toast.error('Valid buying price required.'); return false; }
    if (!form.sellingPrice || parseFloat(form.sellingPrice) < 0) { toast.error('Valid selling price required.'); return false; }
    if (!form.stockQuantity || parseInt(form.stockQuantity) < 1) { toast.error('Stock quantity must be at least 1.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/inventory', {
        medicineId: selectedMedicine._id,
        batchNumber: form.batchNumber,
        buyingDate: form.buyingDate,
        expiryDate: form.expiryDate,
        buyingPrice: parseFloat(form.buyingPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        discountPercentage: parseFloat(form.discountPercentage) || 0,
        stockQuantity: parseInt(form.stockQuantity),
        imageUrl: form.imageUrl,
        notes: form.notes,
      });
      if (data.data.warnings?.length) setWarnings(data.data.warnings);
      toast.success('Medicine added to inventory!');
      navigate('/store/inventory');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Add Medicine</Typography>
          <Typography variant="body2" color="text.secondary">Search from master database, set stock details</Typography>
        </Box>
      </Box>

      {!selectedMedicine ? (
        <Stack spacing={3}>
{/* Search Medicine */}
          <Card sx={{ position: 'relative', zIndex: 1300 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Search Medicine</Typography>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search medicine (e.g., Maxpro, Napa, Seclo)..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  onFocus={() => searchValue && setShowResults(true)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {searchLoading ? <CircularProgress size={20} /> : <Search />}
                      </InputAdornment>
                    ),
                    endAdornment: searchValue && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearchValue(''); setSearchResults([]); setShowResults(false); }}>
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {showResults && searchResults.length > 0 && createPortal(
                  <Paper
                    elevation={8}
                    sx={{
                      position: 'fixed',
                      top: '30%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 99999,
                      maxHeight: 400,
                      width: '500px',
                      maxWidth: '90vw',
                      overflow: 'auto',
                    }}
                  >
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', bgcolor: '#f8fafc' }}>
                      <Typography variant="caption" color="text.secondary">
                        {searchResults.length} result(s) found
                      </Typography>
                    </Box>
                    {searchResults.map((med) => (
                      <Box
                        key={med._id}
                        sx={{
                          display: 'flex', gap: 2, alignItems: 'center', p: 1.5,
                          cursor: 'pointer', '&:hover': { bgcolor: '#f0f9f8' },
                          borderBottom: '1px solid #eee',
                        }}
                        onClick={() => handleSelect(med)}
                      >
                        <img src={getMedicineImage(med.imageUrl)} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {med.brandName} {med.strength}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {med.genericName} · {med.manufacturer}
                          </Typography>
                        </Box>
                        <Chip label={med.dosageForm} size="small" />
                      </Box>
                    ))}
                  </Paper>,
                  document.body
                )}
                {showResults && searchValue && !searchLoading && searchResults.length === 0 && createPortal(
                  <Paper elevation={8} sx={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '500px', maxWidth: '90vw', zIndex: 99999, p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No medicines found for "{searchValue}"
                  </Paper>,
                  document.body
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Browse Medicines</Typography>
                <Chip label={`Page ${browsePage} of ${browsePages}`} size="small" />
              </Box>

              {browseLoading ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
              ) : (
                <>
                  <MuiGrid container spacing={2}>
                    {browseMedicines.map((med) => (
                      <MuiGrid item xs={12} sm={6} md={4} key={med._id}>
                        <Card
                          variant="outlined"
                          sx={{ cursor: 'pointer', '&:hover': { borderColor: '#0d9488' }, p: 2 }}
                          onClick={() => handleSelect(med)}
                        >
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <img src={getMedicineImage(med.imageUrl)} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {med.brandName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {med.genericName} · {med.strength}
                              </Typography>
                            </Box>
                            <Chip label={med.dosageForm} size="small" />
                          </Box>
                        </Card>
                      </MuiGrid>
                    ))}
                  </MuiGrid>

                  {browsePages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                      <Button size="small" disabled={browsePage === 1} onClick={() => setBrowsePage(browsePage - 1)}>Prev</Button>
                      <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                        Page {browsePage} of {browsePages}
                      </Typography>
                      <Button size="small" disabled={browsePage === browsePages} onClick={() => setBrowsePage(browsePage + 1)}>Next</Button>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <img src={getMedicineImage(selectedMedicine.imageUrl)} alt="" style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedMedicine.brandName} {selectedMedicine.strength}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{selectedMedicine.genericName}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={selectedMedicine.dosageForm} size="small" />
                      <Chip label={selectedMedicine.category} size="small" />
                      {selectedMedicine.prescriptionRequired && <Chip label="Rx Required" size="small" color="warning" />}
                    </Stack>
                    {selectedMedicine.standardMrp > 0 && (
                      <Typography variant="caption" color="text.secondary">Standard MRP: {formatCurrency(selectedMedicine.standardMrp)}</Typography>
                    )}
                  </Box>
                </Box>
                <Button size="small" variant="outlined" onClick={handleReset}>Change</Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Stock Details</Typography>
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Batch Number" fullWidth size="small"
                    value={form.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Buying Date" type="date" fullWidth size="small"
                    value={form.buyingDate} onChange={(e) => set('buyingDate', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Expiry Date *" type="date" fullWidth size="small"
                    value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Stock Quantity *" type="number" fullWidth size="small"
                    value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Buying Price *" type="number" fullWidth size="small"
                    value={form.buyingPrice} onChange={(e) => set('buyingPrice', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Selling Price *" type="number" fullWidth size="small"
                    value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12} sm={6}>
                  <TextField label="Discount %" type="number" fullWidth size="small"
                    value={form.discountPercentage} onChange={(e) => set('discountPercentage', e.target.value)} />
                </MuiGrid>
                <MuiGrid item xs={12}>
                  <TextField label="Notes" multiline rows={2} fullWidth size="small"
                    value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </MuiGrid>
              </MuiGrid>

              {warnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {warnings.map((w, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: '#fef3c7', borderRadius: 1, mb: 1 }}>
                      <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />
                      <Typography variant="body2">{w}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button variant="outlined" onClick={handleReset}>Cancel</Button>
                <Button variant="contained" startIcon={<Check />} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Adding...' : 'Add to Inventory'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
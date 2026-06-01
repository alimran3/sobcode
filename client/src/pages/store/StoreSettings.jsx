import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box, Container, Typography, Card, CardContent, TextField,
  Grid, Button, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Stack,
} from '@mui/material';
import AddressSelector from '../../components/common/AddressSelector';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function StoreSettings() {
  const { store } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    pharmacyName: store?.pharmacyName || '',
    drugLicenseNumber: store?.drugLicenseNumber || '',
    tradeLicenseNumber: store?.tradeLicenseNumber || '',
    phone: store?.phone || '',
    lowStockThreshold: store?.lowStockThreshold || 5,
    appAddress: store?.appAddress || { division: '', district: '', upazilla: '', area: '' },
    exactAddress: store?.exactAddress || '',
    operatingHours: store?.operatingHours || { openingTime: '08:00', closingTime: '23:00', weeklyOffDay: 'None', is24Hours: false },
    billSettings: store?.billSettings || { showLogo: true, footerMessage: 'Thank you!', defaultPaymentMethod: 'Cash' },
  });

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/stores/my-store', form);
      toast.success('Settings updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Store Settings</Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Pharmacy Info</Typography>
            <Stack spacing={2}>
              <TextField label="Pharmacy Name" fullWidth value={form.pharmacyName}
                onChange={(e) => set('pharmacyName', e.target.value)} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Drug License" fullWidth value={form.drugLicenseNumber}
                    onChange={(e) => set('drugLicenseNumber', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Trade License" fullWidth value={form.tradeLicenseNumber}
                    onChange={(e) => set('tradeLicenseNumber', e.target.value)} />
                </Grid>
              </Grid>
              <TextField label="Phone" fullWidth value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
              <TextField label="Low Stock Threshold" type="number" fullWidth
                value={form.lowStockThreshold}
                onChange={(e) => set('lowStockThreshold', parseInt(e.target.value))} />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Location</Typography>
            <AddressSelector value={form.appAddress} onChange={(v) => set('appAddress', v)} />
            <TextField label="Exact Address" multiline rows={2} fullWidth sx={{ mt: 2 }}
              value={form.exactAddress} onChange={(e) => set('exactAddress', e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Operating Hours</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Opening" type="time" fullWidth
                  value={form.operatingHours.openingTime}
                  onChange={(e) => set('operatingHours', { ...form.operatingHours, openingTime: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Closing" type="time" fullWidth
                  value={form.operatingHours.closingTime}
                  onChange={(e) => set('operatingHours', { ...form.operatingHours, closingTime: e.target.value })} />
              </Grid>
            </Grid>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Weekly Off Day</InputLabel>
              <Select value={form.operatingHours.weeklyOffDay} label="Weekly Off Day"
                onChange={(e) => set('operatingHours', { ...form.operatingHours, weeklyOffDay: e.target.value })}>
                {['None', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={
              <Switch checked={form.operatingHours.is24Hours}
                onChange={(e) => set('operatingHours', { ...form.operatingHours, is24Hours: e.target.checked })} />
            } label="Open 24/7" sx={{ mt: 1 }} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Bill Settings</Typography>
            <Stack spacing={2}>
              <TextField label="Footer Message" fullWidth value={form.billSettings.footerMessage}
                onChange={(e) => set('billSettings', { ...form.billSettings, footerMessage: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Default Payment Method</InputLabel>
                <Select value={form.billSettings.defaultPaymentMethod} label="Default Payment Method"
                  onChange={(e) => set('billSettings', { ...form.billSettings, defaultPaymentMethod: e.target.value })}>
                  {['Cash', 'bKash', 'Nagad', 'Card'].map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
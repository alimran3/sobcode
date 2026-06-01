import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerPatient, registerStoreOwner, clearError } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import AddressSelector from '../components/common/AddressSelector';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS } from '../utils/constants';
import {
  Container, Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Stepper, Step, StepLabel, Grid, Card, CardContent,
  InputAdornment, IconButton, FormControlLabel, Checkbox, Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Email, Phone, Lock } from '@mui/icons-material';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, loading, error } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(searchParams.get('role') === 'store' ? 'storeOwner' : 'patient');
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    dateOfBirth: '', gender: '', bloodGroup: '',
    appAddress: { division: '', district: '', upazilla: '', area: '' },
    exactAddress: '',
    pharmacyName: '', drugLicenseNumber: '', tradeLicenseNumber: '',
    establishmentYear: '',
    operatingHours: { openingTime: '08:00', closingTime: '23:00', weeklyOffDay: 'None', is24Hours: false },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const path = user.role === 'storeOwner' ? '/store' : '/patient';
      navigate(path, { replace: true });
      toast.success('Registration successful!');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const validateStep = (stepIndex) => {
    if (stepIndex === 0) {
      if (!form.fullName || !form.email || !form.phone || !form.password) {
        toast.error('Fill all required fields.');
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        toast.error('Invalid email.');
        return false;
      }
      if (!/^01[3-9]\d{8}$/.test(form.phone)) {
        toast.error('Invalid BD phone number.');
        return false;
      }
      if (form.password.length < 8) {
        toast.error('Password must be 8+ characters.');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match.');
        return false;
      }
    }
    if (stepIndex === 1 && role === 'storeOwner' && !form.pharmacyName) {
      toast.error('Pharmacy name is required.');
      return false;
    }
    if (stepIndex === 2) {
      if (!form.appAddress.division || !form.appAddress.district || !form.appAddress.upazilla) {
        toast.error('Select your location.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (role === 'patient') {
      dispatch(registerPatient({
        fullName: form.fullName, email: form.email, phone: form.phone, password: form.password,
        dateOfBirth: form.dateOfBirth || undefined, gender: form.gender || undefined, bloodGroup: form.bloodGroup || undefined,
        appAddress: form.appAddress, exactAddress: form.exactAddress,
      }));
    } else {
      dispatch(registerStoreOwner({
        fullName: form.fullName, email: form.email, phone: form.phone, password: form.password,
        pharmacyName: form.pharmacyName, drugLicenseNumber: form.drugLicenseNumber,
        tradeLicenseNumber: form.tradeLicenseNumber, establishmentYear: parseInt(form.establishmentYear) || undefined,
        appAddress: form.appAddress, exactAddress: form.exactAddress,
        operatingHours: form.operatingHours,
      }));
    }
  };

  const steps = role === 'storeOwner'
    ? ['Basic Info', 'Pharmacy', 'Location', 'Hours']
    : ['Basic Info', 'Personal', 'Location'];

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < steps.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 1.5,
              bgcolor: '#0d9488', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800 }}>P</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              pharma<span style={{ color: '#0d9488' }}>Assist</span>
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary">Join PharmaAssist today</Typography>
        </Box>

        <Card sx={{ p: 1, mb: 3 }}>
          <Stepper activeStep={step} sx={{ '& .MuiStepLabel-label': { fontSize: 14 } }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {steps[step]}
          </Typography>

          {step === 0 && (
            <Stack spacing={2.5}>
              <TextField
                label="Full Name" fullWidth required
                value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#9ca3af' }} /></InputAdornment> }}
              />
              <TextField
                label="Email" type="email" fullWidth required
                value={form.email} onChange={(e) => set('email', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#9ca3af' }} /></InputAdornment> }}
              />
              <TextField
                label="Phone" fullWidth required
                value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="01XXXXXXXXX"
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#9ca3af' }} /></InputAdornment> }}
              />
              <TextField
                label="Password" type={showPw ? 'text' : 'password'} fullWidth required
                value={form.password} onChange={(e) => set('password', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9ca3af' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }}
              />
              <TextField
                label="Confirm Password" type="password" fullWidth required
                value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
              />
            </Stack>
          )}

          {step === 1 && role === 'patient' && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Date of Birth" type="date" fullWidth
                    value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)}
                    slotProps={{ htmlInput: { max: '2009-01-01' } }} />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select value={form.gender} label="Gender" onChange={(e) => set('gender', e.target.value)}>
                      <MenuItem value=""><em>Select</em></MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select value={form.bloodGroup} label="Blood Group" onChange={(e) => set('bloodGroup', e.target.value)}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          )}

          {step === 1 && role === 'storeOwner' && (
            <Stack spacing={2.5}>
              <TextField label="Pharmacy Name *" fullWidth required
                value={form.pharmacyName} onChange={(e) => set('pharmacyName', e.target.value)} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Drug License No." fullWidth
                    value={form.drugLicenseNumber} onChange={(e) => set('drugLicenseNumber', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Trade License No." fullWidth
                    value={form.tradeLicenseNumber} onChange={(e) => set('tradeLicenseNumber', e.target.value)} />
                </Grid>
              </Grid>
              <TextField label="Establishment Year" type="number" fullWidth
                value={form.establishmentYear} onChange={(e) => set('establishmentYear', e.target.value)} />
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2.5}>
              <AddressSelector value={form.appAddress} onChange={(v) => set('appAddress', v)} />
              <TextField label="Exact Address" multiline rows={2} fullWidth
                value={form.exactAddress} onChange={(e) => set('exactAddress', e.target.value)} />
            </Stack>
          )}

          {step === 3 && role === 'storeOwner' && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Opening Time" type="time" fullWidth
                    value={form.operatingHours.openingTime}
                    onChange={(e) => set('operatingHours', { ...form.operatingHours, openingTime: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Closing Time" type="time" fullWidth
                    value={form.operatingHours.closingTime}
                    onChange={(e) => set('operatingHours', { ...form.operatingHours, closingTime: e.target.value })} />
                </Grid>
              </Grid>
              <FormControl fullWidth>
                <InputLabel>Weekly Off Day</InputLabel>
                <Select value={form.operatingHours.weeklyOffDay} label="Weekly Off Day"
                  onChange={(e) => set('operatingHours', { ...form.operatingHours, weeklyOffDay: e.target.value })}>
                  {['None', 'Friday', 'Saturday', 'Sunday'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControlLabel control={
                <Checkbox checked={form.operatingHours.is24Hours}
                  onChange={(e) => set('operatingHours', { ...form.operatingHours, is24Hours: e.target.checked })} />
              } label="Open 24/7" />
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
            {step > 0 ? (
              <Button onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Already have an account? <Link to="/login" style={{ color: '#0d9488', textDecoration: 'none' }}>Sign in</Link>
              </Typography>
            )}
            <Button variant="contained" onClick={handleNext} disabled={loading}>
              {step < steps.length - 1 ? 'Next' : 'Create Account'}
            </Button>
          </Stack>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1.5 }}>Register as</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            {[{ key: 'patient', label: 'Patient' }, { key: 'storeOwner', label: 'Store Owner' }].map((r) => (
              <Button key={r.key} variant={role === r.key ? 'contained' : 'outlined'} size="small"
                onClick={() => { setRole(r.key); setStep(0); }}>
                {r.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
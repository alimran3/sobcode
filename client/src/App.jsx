import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CssBaseline, Box, CircularProgress, ThemeProvider, createTheme } from '@mui/material';
import { fetchMe } from './store/slices/authSlice';
import { useAuth } from './hooks/useAuth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import MedicineSearch from './pages/patient/MedicineSearch';
import PharmacyView from './pages/patient/PharmacyView';
import PurchaseHistory from './pages/patient/PurchaseHistory';
import HealthVitals from './pages/patient/HealthVitals';
import Prescriptions from './pages/patient/Prescriptions';
import PatientSettings from './pages/patient/PatientSettings';
import StoreDashboard from './pages/store/StoreDashboard';
import Inventory from './pages/store/Inventory';
import AddMedicine from './pages/store/AddMedicine';
import BillCreation from './pages/store/BillCreation';
import SalesAnalytics from './pages/store/SalesAnalytics';
import StoreSettings from './pages/store/StoreSettings';
import EmployeeManagement from './pages/store/EmployeeManagement';
import AttendanceManagement from './pages/store/AttendanceManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagePharmacies from './pages/admin/ManagePharmacies';
import ManagePatients from './pages/admin/ManagePatients';
import ManageMedicines from './pages/admin/ManageMedicines';
import AdminSettings from './pages/admin/AdminSettings';
import DashboardLayout from './components/layout/DashboardLayout';

const theme = createTheme({
  palette: { primary: { main: '#0d9488' } },
  typography: { fontFamily: '"Inter", system-ui, sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
});

const PageLoader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#0d9488', animation: 'spin 1s linear infinite' }} />
    </Box>
    <Box sx={{ animation: 'pulse 1.5s infinite' }}>
      <Box component="span" sx={{ color: '#0d9488', fontWeight: 700 }}>pharma</Box>
      <Box component="span" sx={{ fontWeight: 700 }}>Assist</Box>
    </Box>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
  </Box>
);

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, initialized } = useAuth();
  if (!initialized) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    const paths = { patient: '/patient', storeOwner: '/store', admin: '/admin' };
    return <Navigate to={paths[user?.role] || '/'} replace />;
  }
  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token, initialized } = useAuth();

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  if (!initialized && token) return <PageLoader />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/patient" element={
            <ProtectedRoute roles={['patient']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PatientDashboard />} />
            <Route path="search" element={<MedicineSearch />} />
            <Route path="pharmacy/:id" element={<PharmacyView />} />
            <Route path="purchases" element={<PurchaseHistory />} />
            <Route path="health" element={<HealthVitals />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>

          <Route path="/store" element={
            <ProtectedRoute roles={['storeOwner']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StoreDashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="add-medicine" element={<AddMedicine />} />
            <Route path="billing" element={<BillCreation />} />
            <Route path="analytics" element={<SalesAnalytics />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="settings" element={<StoreSettings />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="pharmacies" element={<ManagePharmacies />} />
            <Route path="patients" element={<ManagePatients />} />
            <Route path="medicines" element={<ManageMedicines />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
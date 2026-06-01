import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Divider,
} from '@mui/material';
import {
  Dashboard, Search, Receipt, Favorite, Description,
  Settings, Inventory, AddCircle, PointOfSale, BarChart, Group, CalendarMonth,
  LocalPharmacy, People, Science, Logout, Store,
} from '@mui/icons-material';

const patientLinks = [
  { icon: Dashboard, label: 'Dashboard', to: '/patient', end: true },
  { icon: Search, label: 'Find Medicine', to: '/patient/search' },
  { icon: Receipt, label: 'Purchase History', to: '/patient/purchases' },
  { icon: Favorite, label: 'Health Vitals', to: '/patient/health' },
  { icon: Description, label: 'Prescriptions', to: '/patient/prescriptions' },
  { icon: Settings, label: 'Settings', to: '/patient/settings' },
];

const storeLinks = [
  { icon: Dashboard, label: 'Dashboard', to: '/store', end: true },
  { icon: Inventory, label: 'Inventory', to: '/store/inventory' },
  { icon: AddCircle, label: 'Add Medicine', to: '/store/add-medicine' },
  { icon: PointOfSale, label: 'Create Bill', to: '/store/billing' },
  { icon: Group, label: 'Employees', to: '/store/employees' },
  { icon: CalendarMonth, label: 'Attendance', to: '/store/attendance' },
  { icon: BarChart, label: 'Analytics', to: '/store/analytics' },
  { icon: Settings, label: 'Settings', to: '/store/settings' },
];

const adminLinks = [
  { icon: Dashboard, label: 'Dashboard', to: '/admin', end: true },
  { icon: LocalPharmacy, label: 'Pharmacies', to: '/admin/pharmacies' },
  { icon: People, label: 'Patients', to: '/admin/patients' },
  { icon: Science, label: 'Medicine DB', to: '/admin/medicines' },
  { icon: Settings, label: 'Settings', to: '/admin/settings' },
];

const DRAWER_WIDTH = 260;

function NavItem({ item }) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={NavLink}
        to={item.to}
        end={item.end}
        sx={{
          mx: 1.5,
          mb: 0.5,
          py: 1,
          px: 1.5,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          '&.active': {
            bgcolor: '#0d9488',
            color: '#fff',
            '& .MuiListItemIcon-root': { color: '#fff' },
            '&:hover': { bgcolor: '#0b8a80' },
          },
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
      >
        <item.icon sx={{ fontSize: 20 }} />
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, isStoreOwner, isPatient, isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : isStoreOwner ? storeLinks : patientLinks;

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const roleLabel = isAdmin ? 'Administrator' : isStoreOwner ? 'Store Owner' : 'Patient';

  return (
    <Box sx={{
      width: DRAWER_WIDTH,
      height: '100vh',
      bgcolor: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 64,
      zIndex: 1,
    }}>
      {/* User Profile */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#0d9488', fontSize: 14, fontWeight: 600 }}>
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', lineHeight: 1.3 }}
            noWrap>
            {user?.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Store sx={{ fontSize: 12 }} />
            {roleLabel}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        <List dense>
          {links.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', textAlign: 'center' }}>
          PharmaAssist v1.0
        </Typography>
      </Box>
    </Box>
  );
}
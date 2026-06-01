import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, Tooltip, Switch, FormControlLabel,
  Card, CardContent, Grid,
} from '@mui/material';
import { Add, Edit, Delete, PersonAdd, Call, Mail } from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'cashier', label: 'Cashier', color: '#0d9488' },
  { value: 'manager', label: 'Manager', color: '#6366f1' },
  { value: 'pharmacist', label: 'Pharmacist', color: '#8b5cf6' },
  { value: 'helper', label: 'Helper', color: '#f59e0b' },
];

const SHIFTS = ['morning', 'evening', 'night', 'flexible'];

const initialForm = {
  fullName: '', email: '', phone: '',
  password: '', role: 'cashier', salary: '',
  shift: 'morning', workingHours: { start: '09:00', end: '21:00' },
  permissions: {
    canCreateBill: true,
    canManageInventory: false,
    canViewReports: false,
    canManageEmployees: false,
    canProcessReturns: false,
  },
  emergencyContact: { name: '', phone: '', relationship: '' },
  notes: '',
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.data);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/employees/stats');
      setStats(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        salary: form.salary ? Number(form.salary) : 0,
      };
      if (isEdit) {
        await api.put(`/employees/${form._id}`, payload);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee added');
      }
      setOpen(false);
      setForm(initialForm);
      setIsEdit(false);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (emp) => {
    setForm({
      ...emp,
      password: '',
      workingHours: emp.workingHours || { start: '09:00', end: '21:00' },
    });
    setIsEdit(true);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${deleteId}`);
      toast.success('Employee removed');
      setDeleteId(null);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/employees/${id}/toggle-status`);
      setEmployees(employees.map(e => e._id === id ? data.data : e));
      toast.success(data.data.isActive ? 'Employee activated' : 'Employee deactivated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const setField = (field, val) => setForm(prev => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return { ...prev, [parent]: { ...prev[parent], [child]: val } };
    }
    return { ...prev, [field]: val };
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Employee Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage your pharmacy staff</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => { setForm(initialForm); setIsEdit(false); setOpen(true); }}>
          Add Employee
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Total Employees', value: stats?.total || 0, color: '#0d9488' },
          { label: 'Active', value: stats?.active || 0, color: '#10b981' },
          { label: 'Inactive', value: stats?.inactive || 0, color: '#6b7280' },
        ].map((s, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Salary</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : employees.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No employees found</TableCell></TableRow>
            ) : employees.map((emp) => (
              <TableRow key={emp._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: ROLES.find(r => r.value === emp.role)?.color || '#0d9488' }}>
                      {emp.fullName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                    size="small"
                    sx={{ bgcolor: ROLES.find(r => r.value === emp.role)?.color + '20', color: ROLES.find(r => r.value === emp.role)?.color }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{emp.shift.charAt(0).toUpperCase() + emp.shift.slice(1)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">৳{emp.salary?.toLocaleString() || 0}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(emp.joinDate).toLocaleDateString('en-GB')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={emp.isActive}
                    onChange={() => toggleStatus(emp._id)}
                    size="small"
                    color="success"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(emp)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteId(emp._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full Name" fullWidth required
              value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Email" type="email" fullWidth required
                  value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Phone" fullWidth required
                  value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </Grid>
            </Grid>
            {!isEdit && (
              <TextField label="Password" type="password" fullWidth required
                value={form.password} onChange={(e) => setField('password', e.target.value)} />
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={form.role} label="Role" onChange={(e) => setField('role', e.target.value)}>
                    {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Salary (৳)" type="number" fullWidth
                  value={form.salary} onChange={(e) => setField('salary', e.target.value)} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Shift</InputLabel>
                  <Select value={form.shift} label="Shift" onChange={(e) => setField('shift', e.target.value)}>
                    {SHIFTS.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField label="Start" type="time" fullWidth
                  value={form.workingHours?.start || '09:00'} onChange={(e) => setField('workingHours', { ...form.workingHours, start: e.target.value })} />
              </Grid>
              <Grid item xs={3}>
                <TextField label="End" type="time" fullWidth
                  value={form.workingHours?.end || '21:00'} onChange={(e) => setField('workingHours', { ...form.workingHours, end: e.target.value })} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>Permissions</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {Object.entries(form.permissions || {}).map(([key, val]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch checked={val}
                      onChange={(e) => setField('permissions.' + key, e.target.checked)}
                      size="small" />
                  }
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>Emergency Contact</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Name" fullWidth size="small"
                  value={form.emergencyContact.name}
                  onChange={(e) => setField('emergencyContact.name', e.target.value)} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Phone" fullWidth size="small"
                  value={form.emergencyContact.phone}
                  onChange={(e) => setField('emergencyContact.phone', e.target.value)} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Relation" fullWidth size="small"
                  value={form.emergencyContact.relationship}
                  onChange={(e) => setField('emergencyContact.relationship', e.target.value)} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Employee?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
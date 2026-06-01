import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Grid, Stack, Chip, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Avatar,
} from '@mui/material';
import {
  Today, CheckCircle, Cancel, EventNote, Download,
  ArrowBack, NavigateBefore, NavigateNext,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  leave: '#f59e0b',
};

export default function AttendanceManagement() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendance();
    }
  }, [currentDate, employees]);

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

  const fetchAttendance = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const { data } = await api.get('/attendance', { params: { month, year } });
      const attendanceMap = {};
      data.data.forEach(record => {
        const empId = record.employeeId._id;
        const dateKey = new Date(record.date).toDateString();
        attendanceMap[`${empId}_${dateKey}`] = record;
      });
      setAttendance(attendanceMap);
    } catch (err) {
      toast.error('Failed to load attendance');
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const handleStatusChange = async (employeeId, status) => {
    try {
      const date = currentDate.toISOString().split('T')[0];
      const key = `${employeeId}_${new Date(date).toDateString()}`;
      const existing = attendance[key];

      if (existing) {
        const { data } = await api.post('/attendance', {
          employeeId,
          date,
          status,
          hoursWorked: status === 'present' ? 8 : 0,
        });
        setAttendance(prev => ({ ...prev, [key]: data.data }));
      } else {
        const { data } = await api.post('/attendance', {
          employeeId,
          date,
          status,
          hoursWorked: status === 'present' ? 8 : 0,
        });
        setAttendance(prev => ({ ...prev, [key]: data.data }));
      }

      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getStatus = (employeeId) => {
    const dateKey = new Date(currentDate.toISOString().split('T')[0]).toDateString();
    const record = attendance[`${employeeId}_${dateKey}`];
    return record?.status || null;
  };

  const getReport = async () => {
    try {
      const { data } = await api.get('/attendance/report', {
        params: { month: reportMonth, year: reportYear }
      });
      setReportData(data.data);
      setReportOpen(true);
    } catch (err) {
      toast.error('Failed to load report');
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    let csv = 'Name,Role,Monthly Salary,Total Days,Present,Absent,Leave,Daily Rate,Final Salary\n';
    reportData.report.forEach(r => {
      csv += `${r.employee.name},${r.employee.role},${r.monthlySalary},${r.totalDays},${r.present},${r.absent},${r.leave},${r.dailyRate},${r.finalSalary}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${reportYear}-${reportMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">Track employee attendance</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<EventNote />} onClick={getReport}>
            Monthly Report
          </Button>
          <Button
            variant="contained"
            startIcon={<Today />}
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <IconButton onClick={() => changeMonth(-1)}><NavigateBefore /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getMonthName(currentDate)}
          </Typography>
          <IconButton onClick={() => changeMonth(1)}><NavigateNext /></IconButton>
        </Box>
      </Card>

      <Card>
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>
        ) : employees.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No employees found</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Salary</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => {
                  const status = getStatus(emp._id);
                  return (
                    <TableRow key={emp._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#0d9488', width: 32, height: 32, fontSize: 14 }}>
                            {emp.fullName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {emp.fullName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.role} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {emp.salary?.toLocaleString() || 0} / month
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Daily: {emp.salary ? Math.round(emp.salary / getDaysInMonth(currentDate)) : 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {status ? (
                          <Chip
                            icon={status === 'present' ? <CheckCircle /> : status === 'absent' ? <Cancel /> : <EventNote />}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            sx={{
                              bgcolor: STATUS_COLORS[status] + '20',
                              color: STATUS_COLORS[status],
                              '& .MuiChip-icon': { color: STATUS_COLORS[status] },
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">Not marked</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant={status === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => handleStatusChange(emp._id, 'present')}
                            startIcon={<CheckCircle fontSize="small" />}
                          >
                            P
                          </Button>
                          <Button
                            size="small"
                            variant={status === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => handleStatusChange(emp._id, 'absent')}
                            startIcon={<Cancel fontSize="small" />}
                          >
                            A
                          </Button>
                          <Button
                            size="small"
                            variant={status === 'leave' ? 'contained' : 'outlined'}
                            color="warning"
                            onClick={() => handleStatusChange(emp._id, 'leave')}
                            startIcon={<EventNote fontSize="small" />}
                          >
                            L
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Monthly Salary Report</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                size="small"
                label="Month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                type="number"
                size="small"
                label="Year"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                sx={{ width: 100 }}
              />
              <Button onClick={getReport} size="small">Load</Button>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent>
          {reportData ? (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Total Salary:</strong> {reportData.summary.totalSalary.toLocaleString()} |
                  <strong> Present:</strong> {reportData.summary.totalPresent} |
                  <strong> Absent:</strong> {reportData.summary.totalAbsent}
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Salary</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">P</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">A</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">L</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Daily</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Final</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.report.map((r) => (
                      <TableRow key={r.employee.id}>
                        <TableCell>{r.employee.name}</TableCell>
                        <TableCell>{r.employee.role}</TableCell>
                        <TableCell align="right">{r.monthlySalary.toLocaleString()}</TableCell>
                        <TableCell align="center">{r.present}</TableCell>
                        <TableCell align="center" sx={{ color: '#ef4444' }}>{r.absent}</TableCell>
                        <TableCell align="center" sx={{ color: '#f59e0b' }}>{r.leave}</TableCell>
                        <TableCell align="right">{r.dailyRate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0d9488' }}>
                          {r.finalSalary.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No report data</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Close</Button>
          {reportData && (
            <Button variant="contained" startIcon={<Download />} onClick={exportReport}>
              Export CSV
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Stack, Avatar, Tooltip,
} from '@mui/material';
import {
  Inventory, PointOfSale, Add, TrendingUp, Warning,
  Notifications, Person, Logout, Menu as MenuIcon,
  Assessment, People,
} from '@mui/icons-material';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          p: 1.5, borderRadius: 2,
          bgcolor: `${color}15`,
        }}>
          <Icon sx={{ color, fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
          {subValue && (
            <Typography variant="caption" color="text.secondary">{subValue}</Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function StoreDashboard() {
  const { user, store } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stores/my-store/stats');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { icon: Add, label: 'Add Medicine', to: '/store/add-medicine', color: '#0d9488' },
    { icon: PointOfSale, label: 'Create Bill', to: '/store/billing', color: '#6366f1' },
    { icon: Inventory, label: 'Inventory', to: '/store/inventory', color: '#8b5cf6' },
    { icon: Assessment, label: 'Analytics', to: '/store/analytics', color: '#f59e0b' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar sx={{ maxWidth: 1400, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: '#0d9488', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800 }}>P</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              pharma<span style={{ color: '#0d9488' }}>Assist</span>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button component={Link} to="/store/add-medicine" size="small" startIcon={<Add />}>
              Add Medicine
            </Button>
            <Button component={Link} to="/store/billing" variant="contained" size="small">
              New Bill
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
            {store?.pharmacyName || 'Store Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </Typography>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ height: 100, bgcolor: '#f0f0f0', animation: 'pulse 1.5s infinite' }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Inventory} label="Total Medicines" value={stats?.totalMedicines || 0} color="#0d9488" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={TrendingUp}
                  label="Today's Sales"
                  value={formatCurrency(stats?.todaySales?.total || 0)}
                  subValue={`${stats?.todaySales?.count || 0} bills`}
                  color="#6366f1"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={TrendingUp}
                  label="This Month"
                  value={formatCurrency(stats?.monthSales?.total || 0)}
                  subValue={`${stats?.monthSales?.count || 0} bills`}
                  color="#8b5cf6"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={Warning}
                  label="Low Stock"
                  value={stats?.lowStockCount || 0}
                  subValue={`${stats?.outOfStockCount || 0} out of stock`}
                  color="#f59e0b"
                />
              </Grid>
            </Grid>

            {/* Alerts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Expiring in 30 days', value: stats?.expiringSoonCount || 0, color: '#f59e0b' },
                { label: 'Expired Medicines', value: stats?.expiredCount || 0, color: '#ef4444' },
                { label: 'Out of Stock', value: stats?.outOfStockCount || 0, color: '#6366f1' },
              ].map((alert, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Card sx={{ borderLeft: `4px solid ${alert.color}` }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: alert.color }}>
                        {alert.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{alert.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {quickActions.map((action, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Card
                    component={Link}
                    to={action.to}
                    sx={{
                      textDecoration: 'none',
                      textAlign: 'center',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 120,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 4 },
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <action.icon sx={{ fontSize: 36, color: action.color, mb: 1.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                      {action.label}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Recent Bills */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Bills</Typography>
            <Card>
              {!stats?.recentBills || stats.recentBills.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">No bills yet</Typography>
                  <Button component={Link} to="/store/billing" variant="outlined" sx={{ mt: 2 }}>
                    Create First Bill
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Bill #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.recentBills.map((bill) => (
                        <TableRow key={bill._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#0d9488' }}>
                              {bill.billNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {bill.patient?.fullName || bill.walkInCustomer?.name || 'Walk-in'}
                          </TableCell>
                          <TableCell>{bill.items?.length || 0} items</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(bill.grandTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(bill.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {stats?.recentBills?.length > 0 && (
                <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                  <Button component={Link} to="/store/analytics" size="small">
                    View All Bills
                  </Button>
                </Box>
              )}
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
}
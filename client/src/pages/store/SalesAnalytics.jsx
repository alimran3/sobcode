import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Tab, Tabs,
} from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function SalesAnalytics() {
  const [stats, setStats] = useState(null);
  const [bills, setBills] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, billsRes] = await Promise.all([
        api.get('/stores/my-store/stats'),
        api.get('/bills/store?limit=50'),
      ]);
      setStats(statsRes.data.data);
      setBills(billsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales (৳)',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      backgroundColor: '#0d9488',
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Analytics</Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d9488' }}>
                    {formatCurrency(stats?.todaySales?.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Today's Sales</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366f1' }}>
                    {formatCurrency(stats?.monthSales?.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">This Month</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                    {stats?.todaySales?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Bills Today</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                    {stats?.lowStockCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Sales Trend</Typography>
                  <Bar data={chartData} options={chartOptions} height={300} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Top Categories</Typography>
                  <Doughnut
                    data={{
                      labels: ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Others'],
                      datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: ['#0d9488', '#6366f1', '#8b5cf6', '#f59e0b', '#6b7280'],
                      }],
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Recent Bills" />
            <Tab label="Top Medicines" />
          </Tabs>

          <Card>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Bill #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Items</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.slice(0, 10).map((bill) => (
                    <TableRow key={bill._id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#0d9488' }}>{bill.billNumber}</TableCell>
                      <TableCell>{bill.patient?.fullName || bill.walkInCustomer?.name || 'Walk-in'}</TableCell>
                      <TableCell align="right">{bill.items?.length || 0}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(bill.grandTotal)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">{new Date(bill.createdAt).toLocaleDateString('en-GB')}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
}
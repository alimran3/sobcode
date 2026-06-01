import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, Stack,
} from '@mui/material';

export default function Landing({ darkMode, setDarkMode }) {
  const { isAuthenticated, user } = useAuth();
  const dashPath = user?.role === 'storeOwner' ? '/store' : '/patient';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 1.5,
              bgcolor: '#0d9488', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="18" height="22" viewBox="0 0 20 26" fill="none">
                <rect x="2" y="2" width="16" height="22" rx="8" fill="white"/>
                <line x1="2" y1="13" x2="18" y2="13" stroke="#0d9488" strokeWidth="2.5"/>
              </svg>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              pharma<span style={{ color: '#0d9488' }}>Assist</span>
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            {isAuthenticated ? (
              <Button component={Link} to={dashPath} variant="contained" color="primary">
                Dashboard
              </Button>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ color: '#6b7280' }}>
                  Sign In
                </Button>
                <Button component={Link} to="/register" variant="contained" color="primary">
                  Get Started
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{
            fontWeight: 800,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: '#111827',
          }}>
            Find Medicine. Stay Healthy.
          </Typography>

          <Typography variant="body1" sx={{
            color: '#6b7280',
            maxWidth: 500,
            mx: 'auto',
            mt: 2,
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}>
            Connect with nearby pharmacies, discover medicines instantly, and track your health.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              to="/register?role=store"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Register Pharmacy
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: 6, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 700, mb: 5, color: '#111827' }}>
            Features
          </Typography>
          <Grid container spacing={3}>
            {[
              { title: 'Smart Search', desc: 'Find medicines across thousands of listings.' },
              { title: 'Nearby Pharmacies', desc: 'Discover stores in your area.' },
              { title: 'Drug Safety', desc: 'Get alerts for drug interactions.' },
              { title: 'Health Tracking', desc: 'Monitor your vitals over time.' },
            ].map((f, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ height: '100%', border: '1px solid #e5e7eb' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#111827' }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 4, borderTop: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              © 2025 PharmaAssist
            </Typography>
            <Stack direction="row" spacing={3}>
              {['Privacy', 'Terms'].map((item) => (
                <Typography key={item} variant="body2" sx={{ color: '#9ca3af', cursor: 'pointer' }}>
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
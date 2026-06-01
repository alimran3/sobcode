import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { browseMedicines, fetchCategories } from '../../store/slices/medicineSlice';
import { CATEGORY_ICONS } from '../../utils/constants';
import {
  Box, Typography, Button, Card, CardContent, TextField,
  InputAdornment, Chip, Stack, CircularProgress,
} from '@mui/material';
import {
  Search, LocalPharmacy, Inventory2, FilterList,
  EmojiEvents, LocationOn,
} from '@mui/icons-material';
import SearchBar from '../../components/common/SearchBar';
import MedicineCard from '../../components/common/MedicineCard';

import api from '../../utils/api';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { browseResults, categories, loading } = useSelector((s) => s.medicines);
  const location = useSelector((s) => s.location.current);
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(browseMedicines({
      division: location.division,
      district: location.district,
      upazilla: location.upazilla,
      area: location.area,
      category: activeCategory || undefined,
      limit: 20,
    }));
  }, [dispatch, location, activeCategory]);

  const handleSearch = (query) => {
    dispatch(browseMedicines({
      division: location.division,
      district: location.district,
      upazilla: location.upazilla,
      search: query,
      limit: 30,
    }));
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Hey, {firstName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <LocationOn sx={{ fontSize: 16, color: '#0d9488' }} />
          <Typography variant="body2" color="text.secondary">
            {[location.area, location.upazilla, location.district].filter(Boolean).join(', ') || 'Set your location'}
          </Typography>
          <Button size="small" component={Link} to="/patient/settings" sx={{ ml: 1 }}>
            Change
          </Button>
        </Box>
      </Box>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search medicine by name, generic, or category..."
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
        <Chip
          label="All"
          icon={<LocalPharmacy />}
          onClick={() => setActiveCategory('')}
          color={!activeCategory ? 'primary' : 'default'}
          sx={{ flexShrink: 0 }}
        />
        {categories.slice(0, 12).map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat];
          return (
            <Chip
              key={cat}
              label={cat}
              icon={IconComponent ? <IconComponent /> : <LocalPharmacy />}
              onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              color={activeCategory === cat ? 'primary' : 'default'}
              sx={{ flexShrink: 0 }}
            />
          );
        })}
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {activeCategory || 'Medicines Near You'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {browseResults.length} found
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : browseResults.length === 0 ? (
        <Card sx={{ py: 8, textAlign: 'center' }}>
          <Search sx={{ fontSize: 64, color: '#e5e7eb' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>No medicines found</Typography>
          <Typography variant="body2" color="text.secondary">Try changing your location or search term.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {browseResults.map((item) => (
            <MedicineCard key={item._id} item={item} />
          ))}
        </Box>
      )}
    </Box>
  );
}
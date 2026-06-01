import {
  Medication, Water, Favorite, Science, FitnessCenter, Face,
  Visibility, Psychology, MonitorHeart, Air, Restaurant, Biotech,
  Security, Sick, Healing, Sanitizer, WbSunny, ChildCare, Woman, Inventory,
} from '@mui/icons-material';

export const MEDICINE_CATEGORIES = [
  'Painkiller', 'Antibiotic', 'Antacid', 'Antihypertensive', 'Antidiabetic',
  'Vitamin', 'Supplement', 'Dermatological', 'Ophthalmic', 'Psychiatric',
  'Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Hormonal',
  'Antifungal', 'Antiviral', 'Antihistamine', 'Muscle Relaxant',
  'Antiseptic', 'IV Fluid', 'Surgical Supply', 'Baby Care',
  'Women Health', 'Other',
];

export const CATEGORY_ICONS = {
  Painkiller: Medication,
  Antibiotic: Biotech,
  Antacid: Water,
  Antihypertensive: Favorite,
  Antidiabetic: Science,
  Vitamin: WbSunny,
  Supplement: FitnessCenter,
  Dermatological: Face,
  Ophthalmic: Visibility,
  Psychiatric: Psychology,
  Cardiovascular: MonitorHeart,
  Respiratory: Air,
  Gastrointestinal: Restaurant,
  Hormonal: Science,
  Antifungal: Biotech,
  Antiviral: Security,
  Antihistamine: Sick,
  'Muscle Relaxant': Healing,
  Antiseptic: Sanitizer,
  'IV Fluid': Water,
  'Surgical Supply': Healing,
  'Baby Care': ChildCare,
  'Women Health': Woman,
  Other: Inventory,
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Card'];

export const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream',
  'Ointment', 'Gel', 'Drop', 'Inhaler', 'Suppository', 'Powder',
  'Sachet', 'Patch', 'Spray', 'Solution', 'Lotion', 'Other',
];

export const PLACEHOLDER_MEDICINE_IMG = '/placeholder-medicine.png';

export const STOCK_STATUS_CONFIG = {
  healthy: { label: 'In Stock', color: '#10b981', bgLight: '#ecfdf5' },
  low: { label: 'Low Stock', color: '#f59e0b', bgLight: '#fffbeb' },
  outOfStock: { label: 'Out of Stock', color: '#ef4444', bgLight: '#fef2f2' },
  expired: { label: 'Expired', color: '#6b7280', bgLight: '#f3f4f6' },
};

export const EXPIRY_STATUS_CONFIG = {
  safe: { label: 'Safe', color: '#10b981' },
  approaching: { label: 'Approaching', color: '#3b82f6' },
  warning: { label: 'Expiring Soon', color: '#f59e0b' },
  critical: { label: 'Critical', color: '#ef4444' },
  expired: { label: 'Expired', color: '#6b7280' },
};
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const allergySchema = new mongoose.Schema({
  name: { type: String, required: true },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Moderate' },
  reactionDescription: String,
}, { _id: false });

const conditionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  diagnosedDate: Date,
  status: { type: String, enum: ['Active', 'Managed', 'Resolved'], default: 'Active' },
  treatingDoctor: String,
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String,
}, { _id: false });

const appAddressSchema = new mongoose.Schema({
  division: { type: String, required: true },
  district: { type: String, required: true },
  upazilla: { type: String, required: true },
  ward: String,
  area: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^01[3-9]\d{8}$/, 'Please enter a valid BD phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['patient', 'storeOwner', 'admin'],
    default: 'patient',
  },
  photoUrl: {
    type: String,
    default: '',
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: '',
  },

  // Address
  appAddress: appAddressSchema,
  exactAddress: { type: String, default: '' },

  // Health Profile (Patient only)
  allergies: [allergySchema],
  medicalConditions: [conditionSchema],
  currentMedicines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MasterMedicine' }],
  pregnancyStatus: {
    type: String,
    enum: ['Not Applicable', 'Pregnant', 'Not Pregnant', 'Breastfeeding'],
    default: 'Not Applicable',
  },
  smokingStatus: {
    type: String,
    enum: ['Never', 'Former', 'Current'],
    default: 'Never',
  },
  emergencyContact: emergencyContactSchema,
  previousSurgeries: { type: String, default: '' },

  // Vitals
  height: Number, // cm
  weight: Number, // kg
  bmi: Number,

  // Family history
  familyHistory: {
    father: String,
    mother: String,
  },

  // Settings
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    browser: { type: Boolean, default: true },
  },
  privacySettings: {
    healthProfileVisibility: {
      type: String,
      enum: ['all', 'approved', 'none'],
      default: 'all',
    },
    purchaseHistoryVisible: { type: Boolean, default: true },
  },
  language: { type: String, enum: ['en', 'bn'], default: 'en' },
  darkMode: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active',
  },

  refreshToken: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for age
userSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for BMI calculation
userSchema.pre('save', function () {
  if (this.height && this.weight) {
    const heightM = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightM * heightM)).toFixed(1));
  }
});

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for search
userSchema.index({ 'appAddress.division': 1, 'appAddress.district': 1, 'appAddress.upazilla': 1 });

const User = mongoose.model('User', userSchema);
export default User;
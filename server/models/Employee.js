import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    match: [/^01[3-9]\d{8}$/, 'Invalid BD phone'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['cashier', 'manager', 'pharmacist', 'helper'],
    default: 'cashier',
  },
  salary: {
    type: Number,
    default: 0,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night', 'flexible'],
    default: 'morning',
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '21:00' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: {
    canCreateBill: { type: Boolean, default: true },
    canManageInventory: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageEmployees: { type: Boolean, default: false },
    canProcessReturns: { type: Boolean, default: false },
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

employeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.index({ storeId: 1, email: 1 }, { unique: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
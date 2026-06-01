import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreInventory',
    required: true,
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterMedicine',
    required: true,
  },
  medicineName: String,
  genericName: String,
  strength: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
  conflictWarnings: [{
    type: { type: String, enum: ['allergy', 'drugDrug', 'condition', 'age', 'pregnancy', 'duplicate'] },
    severity: { type: String, enum: ['red', 'yellow'] },
    message: String,
    overridden: { type: Boolean, default: false },
    overrideReason: String,
  }],
}, { _id: true });

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    required: true,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  storeOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  walkInCustomer: {
    name: String,
    phone: String,
  },
  items: [billItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'bKash', 'Nagad', 'Card'],
    default: 'Cash',
  },
  notes: {
    type: String,
    default: '',
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'partial_refund'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// Auto-generate bill number
billSchema.pre('validate', async function () {
  if (!this.billNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Bill').countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`) },
    });
    this.billNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
});

billSchema.index({ store: 1, createdAt: -1 });
billSchema.index({ patient: 1, createdAt: -1 });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
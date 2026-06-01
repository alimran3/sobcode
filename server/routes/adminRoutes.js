import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleGuard.js';
import User from '../models/User.js';
import Store from '../models/Store.js';
import MasterMedicine from '../models/MasterMedicine.js';
import Bill from '../models/Bill.js';
import Review from '../models/Review.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', protect, isAdmin, async (req, res, next) => {
  try {
    const [totalPharmacies, totalPatients, totalMedicines, todayBills, reportedReviews] = await Promise.all([
      Store.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      MasterMedicine.countDocuments(),
      Bill.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Review.countDocuments({ reported: true, status: 'active' }),
    ]);

    res.json({
      success: true,
      data: { totalPharmacies, totalPatients, totalMedicines, todayBills, reportedReviews },
    });
  } catch (error) {
    next(error);
  }
});

// Manage pharmacies
router.get('/pharmacies', protect, isAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .populate('owner', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ 
      success: true, 
      data: { 
        stores, 
        pagination: { 
          page: parseInt(page), 
          limit: parseInt(limit), 
          total, 
          pages: Math.ceil(total / limit) 
        } 
      } 
    });
  } catch (error) {
    next(error);
  }
});

// Update pharmacy status
router.put('/pharmacies/:id/status', protect, isAdmin, async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: { store } });
  } catch (error) {
    next(error);
  }
});

// Manage patients
router.get('/patients', protect, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { role: 'patient' };
    const total = await User.countDocuments(filter);
    const patients = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ 
      success: true, 
      data: { 
        patients, 
        pagination: { 
          page: parseInt(page), 
          limit: parseInt(limit), 
          total, 
          pages: Math.ceil(total / limit) 
        } 
      } 
    });
  } catch (error) {
    next(error);
  }
});

// Manage master medicines
router.post('/medicines', protect, isAdmin, async (req, res, next) => {
  try {
    const medicine = await MasterMedicine.create(req.body);
    res.status(201).json({ success: true, data: { medicine } });
  } catch (error) {
    next(error);
  }
});

router.put('/medicines/:id', protect, isAdmin, async (req, res, next) => {
  try {
    const medicine = await MasterMedicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, data: { medicine } });
  } catch (error) {
    next(error);
  }
});

// Moderate reviews
router.get('/reviews/reported', protect, isAdmin, async (req, res, next) => {
  try {
    const reviews = await Review.find({ reported: true, status: 'active' })
      .populate('patient', 'fullName')
      .populate('store', 'pharmacyName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
});

router.put('/reviews/:id/moderate', protect, isAdmin, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status, reported: false }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
});

export default router;
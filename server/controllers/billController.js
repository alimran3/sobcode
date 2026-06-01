import Bill from '../models/Bill.js';
import Store from '../models/Store.js';
import StoreInventory from '../models/StoreInventory.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { checkConflicts } from '../utils/conflictChecker.js';
import { generateBillPDF } from '../utils/pdfGenerator.js';

// Check conflicts before creating bill
export const checkBillConflicts = async (req, res, next) => {
  try {
    const { patientId, items } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and items are required.' });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const allWarnings = [];

    for (const item of items) {
      const inventoryItem = await StoreInventory.findById(item.inventoryItemId).populate('medicine');
      if (!inventoryItem) continue;

      const warnings = await checkConflicts(patient, inventoryItem.medicine);
      allWarnings.push({
        inventoryItemId: item.inventoryItemId,
        medicineName: inventoryItem.medicine.brandName,
        warnings,
      });
    }

    const redCount = allWarnings.flatMap((w) => w.warnings).filter((w) => w.severity === 'red').length;
    const yellowCount = allWarnings.flatMap((w) => w.warnings).filter((w) => w.severity === 'yellow').length;

    res.json({
      success: true,
      data: {
        warnings: allWarnings,
        totalRed: redCount,
        totalYellow: yellowCount,
        hasConflicts: redCount > 0 || yellowCount > 0,
        canProceed: redCount === 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new bill
export const createBill = async (req, res, next) => {
  try {
    console.log('Creating bill with payload:', req.body);
    
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    const { patientId, walkInCustomer, items, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill must have at least one item.' });
    }

    let patient = null;
    if (patientId) {
      patient = await User.findById(patientId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found.' });
      }
    }

    const billItems = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const inventoryItem = await StoreInventory.findById(item.inventoryItemId).populate('medicine');

      if (!inventoryItem) {
        return res.status(404).json({
          success: false,
          message: `Inventory item ${item.inventoryItemId} not found.`,
        });
      }

      // Check if inventory item belongs to store
      if (inventoryItem.store.toString() !== store._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Inventory item does not belong to your store.',
        });
      }

      if (inventoryItem.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${inventoryItem.medicine.brandName}. Available: ${inventoryItem.stockQuantity}.`,
        });
      }

      if (inventoryItem.status === 'expired') {
        return res.status(400).json({
          success: false,
          message: `${inventoryItem.medicine.brandName} is expired. Cannot sell.`,
        });
      }

      // Run conflict checks if patient linked
      let conflictWarnings = [];
      if (patient && patient.privacySettings?.healthProfileVisibility !== 'none') {
        conflictWarnings = await checkConflicts(patient, inventoryItem.medicine);
      }

      const discount = item.discountOverride !== undefined
        ? item.discountOverride
        : inventoryItem.discountPercentage;
      const lineSubtotal = inventoryItem.sellingPrice * item.quantity;
      const lineDiscount = lineSubtotal * (discount / 100);
      const lineTotal = lineSubtotal - lineDiscount;

      billItems.push({
        inventoryItem: inventoryItem._id,
        medicine: inventoryItem.medicine._id,
        medicineName: inventoryItem.medicine.brandName,
        genericName: inventoryItem.medicine.genericName,
        strength: inventoryItem.medicine.strength,
        quantity: item.quantity,
        unitPrice: inventoryItem.sellingPrice,
        discountPercentage: discount,
        lineTotal,
        conflictWarnings: conflictWarnings.map((w) => ({
          ...w,
          overridden: item.overrideConflicts || false,
          overrideReason: item.overrideReason || '',
        })),
      });

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
    }

    const grandTotal = subtotal - totalDiscount;

    const bill = await Bill.create({
      store: store._id,
      storeOwner: req.user._id,
      patient: patient ? patient._id : null,
      walkInCustomer: !patient ? walkInCustomer : undefined,
      items: billItems,
      subtotal,
      totalDiscount,
      grandTotal,
      paymentMethod: paymentMethod || 'Cash',
      notes,
    });

    console.log('Bill created:', bill._id);

    // Decrement stock
    for (const item of items) {
      await StoreInventory.findByIdAndUpdate(item.inventoryItemId, {
        $inc: { stockQuantity: -item.quantity },
      });

      // Check for low stock
      const updatedItem = await StoreInventory.findById(item.inventoryItemId);
      const threshold = updatedItem.customLowStockThreshold || store.lowStockThreshold;

      if (updatedItem.stockQuantity === 0) {
        await Notification.create({
          recipient: req.user._id,
          type: 'outOfStock',
          title: 'Out of Stock',
          message: `${updatedItem.medicine.brandName} is now out of stock.`,
          priority: 'high',
          data: { inventoryItemId: updatedItem._id },
        });
      } else if (updatedItem.stockQuantity <= threshold) {
        await Notification.create({
          recipient: req.user._id,
          type: 'lowStock',
          title: 'Low Stock Alert',
          message: `Stock is running low (${updatedItem.stockQuantity} remaining).`,
          priority: 'medium',
          data: { inventoryItemId: updatedItem._id },
        });
      }
    }

    // Notify patient
    if (patient) {
      const allConflicts = billItems.flatMap((item) => item.conflictWarnings || []);
      const redConflicts = allConflicts.filter((w) => w.severity === 'red');
      const yellowConflicts = allConflicts.filter((w) => w.severity === 'yellow');

      // Send conflict alert notification if there are any warnings
      if (allConflicts.length > 0) {
        const conflictMessages = allConflicts.map((w) => `• ${w.message}`).join('\n');
        
        await Notification.create({
          recipient: patient._id,
          type: 'conflictAlert',
          title: `Drug Safety Alert from ${store.pharmacyName}`,
          message: `${allConflicts.length} warning(s) detected for your recent purchase. Please consult your doctor.`,
          priority: redConflicts.length > 0 ? 'critical' : 'medium',
          data: {
            billId: bill._id,
            storeId: store._id,
            conflictCount: allConflicts.length,
            redCount: redConflicts.length,
            yellowCount: yellowConflicts.length,
            conflicts: allConflicts.map((w) => ({
              type: w.type,
              severity: w.severity,
              message: w.message,
              medicineName: billItems.find((bi) => 
                bi.conflictWarnings?.some((cw) => cw.message === w.message)
              )?.medicineName || '',
            })),
          },
        });

        // Also notify the store owner about critical conflicts
        if (redConflicts.length > 0) {
          await Notification.create({
            recipient: req.user._id,
            type: 'conflictAlert',
            title: 'Critical Conflict Alert',
            message: `${redConflicts.length} critical conflict(s) detected for patient ${patient.fullName}. Sale completed but patient was notified.`,
            priority: 'critical',
            data: {
              billId: bill._id,
              patientId: patient._id,
              patientName: patient.fullName,
              conflictCount: redConflicts.length,
            },
          });
        }

        // Emit socket event for real-time conflict alert
        const io = req.app.get('io');
        if (io) {
          io.emit(`notification:${patient._id}`, {
            type: 'conflictAlert',
            priority: redConflicts.length > 0 ? 'critical' : 'medium',
            message: `Drug safety alert: ${allConflicts.length} warning(s) detected.`,
            data: { billId: bill._id },
          });
        }
      }

      await Notification.create({
        recipient: patient._id,
        type: 'purchaseConfirmation',
        title: 'Purchase Recorded',
        message: `Your purchase of ${grandTotal.toFixed(2)} BDT from ${store.pharmacyName} has been recorded.`,
        priority: 'low',
        data: { billId: bill._id, storeId: store._id },
      });

      const medicineIds = billItems.map((item) => item.medicine);
      const existingIds = patient.currentMedicines.map((id) => id.toString());
      const newMedicines = medicineIds.filter((id) => !existingIds.includes(id.toString()));
      
      if (newMedicines.length > 0) {
        patient.currentMedicines = [...patient.currentMedicines, ...newMedicines];
        await patient.save();
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io && patient) {
      io.emit(`notification:${patient._id}`, {
        type: 'purchaseConfirmation',
        message: `Purchase of ${grandTotal.toFixed(2)} BDT recorded.`,
      });
    }

    await bill.populate([
      { path: 'store', select: 'pharmacyName exactAddress phone logoUrl' },
      { path: 'patient', select: 'fullName phone' },
      { path: 'items.medicine', select: 'brandName genericName strength dosageForm' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully.',
      data: { bill },
    });
  } catch (error) {
    console.error('Create bill error:', error);
    next(error);
  }
};

// Get bills for store owner
export const getStoreBills = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    const { page = 1, limit = 20, dateFrom, dateTo } = req.query;

    const filter = { store: store._id };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await Bill.countDocuments(filter);

    const bills = await Bill.find(filter)
      .populate('patient', 'fullName phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        bills,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single bill
export const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('store', 'pharmacyName exactAddress phone logoUrl drugLicenseNumber billSettings')
      .populate('patient', 'fullName phone email')
      .populate('items.medicine');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    // Ensure requester has access
    const isOwner = bill.storeOwner.toString() === req.user._id.toString();
    const isPatient = bill.patient && bill.patient._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPatient && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { bill } });
  } catch (error) {
    next(error);
  }
};

// Get patient purchase history
export const getPatientPurchaseHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, dateFrom, dateTo } = req.query;

    const filter = { patient: req.user._id };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await Bill.countDocuments(filter);

    const bills = await Bill.find(filter)
      .populate('store', 'pharmacyName exactAddress phone appAddress logoUrl')
      .populate('items.medicine', 'brandName genericName strength dosageForm imageUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Stats
    const stats = await Bill.aggregate([
      { $match: { patient: req.user._id } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 },
          avgBillAmount: { $avg: '$grandTotal' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        purchases: bills,
        stats: stats[0] || { totalSpent: 0, totalBills: 0, avgBillAmount: 0 },
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Download bill as PDF
export const downloadBillPDF = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('store', 'pharmacyName exactAddress phone drugLicenseNumber billSettings')
      .populate('patient', 'fullName phone email')
      .populate('items.medicine', 'brandName genericName strength dosageForm');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    // Ensure requester has access
    const isOwner = bill.storeOwner.toString() === req.user._id.toString();
    const isPatient = bill.patient && bill.patient._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPatient && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Generate PDF
    const pdfBuffer = await generateBillPDF(bill, bill.store);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bill.billNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    next(error);
  }
};
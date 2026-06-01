import Employee from '../models/Employee.js';
import Store from '../models/Store.js';

export const getEmployees = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const employees = await Employee.find({ storeId })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const employee = await Employee.findOne({ _id: req.params.id, storeId }).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }

    const employee = new Employee({ ...req.body, storeId });
    await employee.save();
    employee.password = undefined;

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, storeId },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, storeId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleEmployeeStatus = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const employee = await Employee.findOne({ _id: req.params.id, storeId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }

    const total = await Employee.countDocuments({ storeId });
    const active = await Employee.countDocuments({ storeId, isActive: true });
    const inactive = total - active;

    const byRole = await Employee.aggregate([
      { $match: { storeId } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        byRole,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
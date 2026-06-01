import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, hoursWorked, notes } = req.body;
    const storeId = req.user.storeId;

    const existing = await Attendance.findOne({
      employeeId,
      date: new Date(date),
      storeId,
    });

    if (existing) {
      existing.status = status || existing.status;
      existing.hoursWorked = hoursWorked || existing.hoursWorked;
      existing.notes = notes || existing.notes;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(date),
      status: status || 'present',
      hoursWorked: hoursWorked || 8,
      notes: notes || '',
      storeId,
      markedBy: req.user._id,
    });
    await attendance.save();
    res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    const storeId = req.user.storeId;
    const results = [];

    for (const record of records) {
      const existing = await Attendance.findOne({
        employeeId: record.employeeId,
        date: new Date(record.date),
        storeId,
      });

      if (existing) {
        existing.status = record.status || existing.status;
        existing.hoursWorked = record.hoursWorked || existing.hoursWorked;
        existing.markedBy = req.user._id;
        await existing.save();
        results.push(existing);
      } else {
        const attendance = new Attendance({
          employeeId: record.employeeId,
          date: new Date(record.date),
          status: record.status || 'present',
          hoursWorked: record.hoursWorked || 8,
          storeId,
          markedBy: req.user._id,
        });
        await attendance.save();
        results.push(attendance);
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const storeId = req.user.storeId;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const query = { storeId };
    if (employeeId) query.employeeId = employeeId;
    query.date = { $gte: startDate, $lte: endDate };

    const records = await Attendance.find(query)
      .populate('employeeId', 'fullName role salary')
      .sort({ date: 1 });

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const storeId = req.user.storeId;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const employees = await Employee.find({ storeId, isActive: true });
    const records = await Attendance.find({
      storeId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('employeeId', 'fullName role salary shift workingHours');

    const report = employees.map(emp => {
      const empRecords = records.filter(r =>
        r.employeeId._id.toString() === emp._id.toString()
      );

      const presentDays = empRecords.filter(r => r.status === 'present').length;
      const absentDays = empRecords.filter(r => r.status === 'absent').length;
      const leaveDays = empRecords.filter(r => r.status === 'leave').length;
      const totalDays = new Date(year, month, 0).getDate();
      const workingDays = totalDays - (emp.shift === 'flexible' ? 0 : 4);

      const dailyRate = emp.salary / totalDays;
      const earnedSalary = presentDays * dailyRate + (leaveDays * dailyRate * 0.5);
      const unpaidAbsences = absentDays * dailyRate;

      return {
        employee: {
          id: emp._id,
          name: emp.fullName,
          role: emp.role,
        },
        monthlySalary: emp.salary,
        totalDays,
        present: presentDays,
        absent: absentDays,
        leave: leaveDays,
        workingDays,
        dailyRate: Math.round(dailyRate * 100) / 100,
        earnedSalary: Math.round(earnedSalary * 100) / 100,
        unpaidAbsences: Math.round(unpaidAbsences * 100) / 100,
        finalSalary: Math.round(earnedSalary * 100) / 100,
      };
    });

    const summary = {
      totalSalary: report.reduce((sum, r) => sum + r.finalSalary, 0),
      totalPresent: report.reduce((sum, r) => sum + r.present, 0),
      totalAbsent: report.reduce((sum, r) => sum + r.absent, 0),
    };

    res.json({ success: true, data: { report, summary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
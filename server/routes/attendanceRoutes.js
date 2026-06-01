import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  markAttendance,
  bulkMarkAttendance,
  getAttendance,
  getMonthlyReport,
} from '../controllers/attendanceController.js';

const router = express.Router();

router.use(protect);

router.post('/', markAttendance);
router.post('/bulk', bulkMarkAttendance);
router.get('/', getAttendance);
router.get('/report', getMonthlyReport);

export default router;
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getEmployeeStats,
} from '../controllers/employeeController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.get('/stats', getEmployeeStats);

router.route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

router.patch('/:id/toggle-status', toggleEmployeeStatus);

export default router;
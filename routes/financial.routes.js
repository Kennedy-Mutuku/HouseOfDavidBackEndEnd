const express = require('express');
const router = express.Router();
const {
  recordIncome,
  recordExpense,
  getAllTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  generateStatement,
  getFinancialSummary
} = require('../controllers/financial.controller');
const { protect, isSuperAdmin } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');

// All routes require authentication and SuperAdmin role
router.use(protect);
router.use(isSuperAdmin);

// Summary/Stats route
router.get('/summary', getFinancialSummary);

// Statement generation
router.get('/statement', generateStatement);

// Income routes
router.post('/income', upload.single('receipt'), handleMulterError, recordIncome);

// Expense routes
router.post('/expense', upload.single('receipt'), handleMulterError, recordExpense);

// Transactions routes
router.get('/transactions', getAllTransactions);
router.get('/transactions/:id', getTransaction);
router.put('/transactions/:id', upload.single('receipt'), handleMulterError, updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

module.exports = router;

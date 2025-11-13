const FinancialTransaction = require('../models/FinancialTransaction.model');
const path = require('path');
const fs = require('fs');

// @desc    Record income
// @route   POST /api/financial/income
// @access  Private (SuperAdmin)
exports.recordIncome = async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;

    // Validate required fields
    if (!category || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and date are required'
      });
    }

    const transactionData = {
      type: 'Income',
      category: category.trim(),
      amount: parseFloat(amount),
      date: new Date(date),
      description: description ? description.trim() : '',
      recordedBy: req.user._id,
      status: 'Completed'
    };

    // Handle file upload if present
    if (req.file) {
      transactionData.receiptFileName = req.file.filename;
      transactionData.receiptOriginalName = req.file.originalname;
      transactionData.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const transaction = await FinancialTransaction.create(transactionData);

    // Populate recordedBy before sending response
    await transaction.populate('recordedBy', 'firstName lastName fullName email');

    res.status(201).json({
      success: true,
      message: 'Income recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error recording income:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record income'
    });
  }
};

// @desc    Record expense
// @route   POST /api/financial/expense
// @access  Private (SuperAdmin)
exports.recordExpense = async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;

    // Validate required fields
    if (!category || !amount || !date || !description) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Category, amount, date, and description are required for expenses'
      });
    }

    const transactionData = {
      type: 'Expense',
      category: category.trim(),
      amount: parseFloat(amount),
      date: new Date(date),
      description: description.trim(),
      recordedBy: req.user._id,
      status: 'Completed'
    };

    // Handle file upload if present
    if (req.file) {
      transactionData.receiptFileName = req.file.filename;
      transactionData.receiptOriginalName = req.file.originalname;
      transactionData.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const transaction = await FinancialTransaction.create(transactionData);

    // Populate recordedBy before sending response
    await transaction.populate('recordedBy', 'firstName lastName fullName email');

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record expense'
    });
  }
};

// @desc    Get all financial transactions
// @route   GET /api/financial/transactions
// @access  Private (SuperAdmin)
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, status } = req.query;
    let query = {};

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = new RegExp(category, 'i'); // Case-insensitive search
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // Include entire end date
        query.date.$lte = endDateObj;
      }
    }

    const transactions = await FinancialTransaction.find(query)
      .populate('recordedBy', 'firstName lastName fullName email')
      .populate('updatedBy', 'firstName lastName fullName email')
      .sort('-date -createdAt');

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'Income' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Expense' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    res.status(200).json({
      success: true,
      count: transactions.length,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance
      },
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/financial/transactions/:id
// @access  Private (SuperAdmin)
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id)
      .populate('recordedBy', 'firstName lastName fullName email')
      .populate('updatedBy', 'firstName lastName fullName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/financial/transactions/:id
// @access  Private (SuperAdmin)
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await FinancialTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update allowed fields
    const { category, amount, date, description, status } = req.body;

    if (category) transaction.category = category.trim();
    if (amount) transaction.amount = parseFloat(amount);
    if (date) transaction.date = new Date(date);
    if (description !== undefined) transaction.description = description.trim();
    if (status) transaction.status = status;

    transaction.updatedBy = req.user._id;

    // Handle new file upload
    if (req.file) {
      // Delete old receipt file if exists
      if (transaction.receiptFileName) {
        const oldFilePath = path.join(__dirname, '../uploads/receipts', transaction.receiptFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      transaction.receiptFileName = req.file.filename;
      transaction.receiptOriginalName = req.file.originalname;
      transaction.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    await transaction.save();

    // Populate before sending response
    await transaction.populate('recordedBy', 'firstName lastName fullName email');
    await transaction.populate('updatedBy', 'firstName lastName fullName email');

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update transaction'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/financial/transactions/:id
// @access  Private (SuperAdmin)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Delete associated receipt file if exists
    if (transaction.receiptFileName) {
      const filePath = path.join(__dirname, '../uploads/receipts', transaction.receiptFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await FinancialTransaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete transaction'
    });
  }
};

// @desc    Generate financial statement
// @route   GET /api/financial/statement
// @access  Private (SuperAdmin)
exports.generateStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    // Fetch all transactions in date range
    const transactions = await FinancialTransaction.find({
      date: { $gte: start, $lte: end },
      status: 'Completed'
    })
      .populate('recordedBy', 'firstName lastName fullName email')
      .sort('date');

    // Separate income and expenses
    const incomeTransactions = transactions.filter(t => t.type === 'Income');
    const expenseTransactions = transactions.filter(t => t.type === 'Expense');

    // Calculate totals
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    // Group by category
    const incomeByCategory = {};
    incomeTransactions.forEach(t => {
      if (!incomeByCategory[t.category]) {
        incomeByCategory[t.category] = 0;
      }
      incomeByCategory[t.category] += t.amount;
    });

    const expensesByCategory = {};
    expenseTransactions.forEach(t => {
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += t.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        summary: {
          totalIncome,
          totalExpenses,
          netBalance
        },
        incomeByCategory,
        expensesByCategory,
        transactions: {
          income: incomeTransactions,
          expenses: expenseTransactions
        },
        generatedAt: new Date(),
        generatedBy: {
          id: req.user._id,
          name: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate statement'
    });
  }
};

// @desc    Get financial summary/stats
// @route   GET /api/financial/summary
// @access  Private (SuperAdmin)
exports.getFinancialSummary = async (req, res) => {
  try {
    // Get all completed transactions
    const allTransactions = await FinancialTransaction.find({ status: 'Completed' });

    const totalIncome = allTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Current month stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTransactions = await FinancialTransaction.find({
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
      status: 'Completed'
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthNetBalance = monthIncome - monthExpenses;

    res.status(200).json({
      success: true,
      data: {
        allTime: {
          totalIncome,
          totalExpenses,
          netBalance,
          transactionCount: allTransactions.length
        },
        currentMonth: {
          totalIncome: monthIncome,
          totalExpenses: monthExpenses,
          netBalance: monthNetBalance,
          transactionCount: monthTransactions.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch financial summary'
    });
  }
};

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { DiagnosticTest, User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/diagnostic-tests
// @desc    Get user's diagnostic tests with pagination and filtering
// @access  Private
router.get('/', [
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('testType')
    .optional()
    .isIn(['blood', 'urine', 'imaging', 'cardiac', 'neurological', 'genetic', 'general'])
    .withMessage('Invalid test type filter'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'reviewed', 'cancelled'])
    .withMessage('Invalid status filter'),
  query('isAbnormal')
    .optional()
    .isBoolean()
    .withMessage('isAbnormal must be a boolean'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { userId: req.user.id };
    if (req.query.testType) whereClause.testType = req.query.testType;
    if (req.query.status) whereClause.status = req.query.status;
    if (req.query.isAbnormal !== undefined) whereClause.isAbnormal = req.query.isAbnormal === 'true';
    
    // Date range filtering
    if (req.query.dateFrom || req.query.dateTo) {
      whereClause.date = {};
      if (req.query.dateFrom) {
        whereClause.date[DiagnosticTest.sequelize.Sequelize.Op.gte] = req.query.dateFrom;
      }
      if (req.query.dateTo) {
        whereClause.date[DiagnosticTest.sequelize.Sequelize.Op.lte] = req.query.dateTo;
      }
    }

    const { count, rows: tests } = await DiagnosticTest.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      tests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get diagnostic tests error:', error);
    res.status(500).json({
      message: 'Server error while fetching diagnostic tests'
    });
  }
});

// @route   GET /api/diagnostic-tests/recent
// @desc    Get user's recent diagnostic tests (last 30 days)
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const tests = await DiagnosticTest.findRecentByUser(req.user.id, days);

    res.json({
      tests,
      count: tests.length,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Get recent tests error:', error);
    res.status(500).json({
      message: 'Server error while fetching recent tests'
    });
  }
});

// @route   GET /api/diagnostic-tests/abnormal
// @desc    Get user's abnormal diagnostic tests
// @access  Private
router.get('/abnormal', auth, async (req, res) => {
  try {
    const tests = await DiagnosticTest.findAbnormalByUser(req.user.id);

    res.json({
      tests,
      count: tests.length
    });
  } catch (error) {
    console.error('Get abnormal tests error:', error);
    res.status(500).json({
      message: 'Server error while fetching abnormal tests'
    });
  }
});

// @route   GET /api/diagnostic-tests/:id
// @desc    Get specific diagnostic test
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const test = await DiagnosticTest.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!test) {
      return res.status(404).json({
        message: 'Diagnostic test not found'
      });
    }

    res.json({ test });
  } catch (error) {
    console.error('Get diagnostic test error:', error);
    res.status(500).json({
      message: 'Server error while fetching diagnostic test'
    });
  }
});

// @route   POST /api/diagnostic-tests
// @desc    Create new diagnostic test
// @access  Private
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('result')
    .trim()
    .notEmpty()
    .withMessage('Result is required'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('testType')
    .optional()
    .isIn(['blood', 'urine', 'imaging', 'cardiac', 'neurological', 'genetic', 'general'])
    .withMessage('Test type must be blood, urine, imaging, cardiac, neurological, genetic, or general'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'reviewed', 'cancelled'])
    .withMessage('Status must be pending, completed, reviewed, or cancelled'),
  body('normalRange')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Normal range must not exceed 255 characters'),
  body('units')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Units must not exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('doctorName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Doctor name must not exceed 255 characters'),
  body('labName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lab name must not exceed 255 characters'),
  body('isAbnormal')
    .optional()
    .isBoolean()
    .withMessage('isAbnormal must be a boolean'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      result,
      date,
      testType,
      status,
      normalRange,
      units,
      notes,
      doctorName,
      labName,
      isAbnormal,
      attachments
    } = req.body;

    const test = await DiagnosticTest.create({
      name,
      result,
      date,
      testType: testType || 'general',
      status: status || 'completed',
      normalRange,
      units,
      notes,
      doctorName,
      labName,
      isAbnormal: isAbnormal || false,
      attachments: attachments || [],
      userId: req.user.id
    });

    // Fetch the created test with user info
    const createdTest = await DiagnosticTest.findByPk(test.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json({
      message: 'Diagnostic test created successfully',
      test: createdTest
    });
  } catch (error) {
    console.error('Create diagnostic test error:', error);
    res.status(500).json({
      message: 'Server error while creating diagnostic test'
    });
  }
});

// @route   PUT /api/diagnostic-tests/:id
// @desc    Update diagnostic test
// @access  Private
router.put('/:id', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('result')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Result cannot be empty'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('testType')
    .optional()
    .isIn(['blood', 'urine', 'imaging', 'cardiac', 'neurological', 'genetic', 'general'])
    .withMessage('Test type must be blood, urine, imaging, cardiac, neurological, genetic, or general'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'reviewed', 'cancelled'])
    .withMessage('Status must be pending, completed, reviewed, or cancelled'),
  body('normalRange')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Normal range must not exceed 255 characters'),
  body('units')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Units must not exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('doctorName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Doctor name must not exceed 255 characters'),
  body('labName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lab name must not exceed 255 characters'),
  body('isAbnormal')
    .optional()
    .isBoolean()
    .withMessage('isAbnormal must be a boolean'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const test = await DiagnosticTest.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!test) {
      return res.status(404).json({
        message: 'Diagnostic test not found'
      });
    }

    const {
      name,
      result,
      date,
      testType,
      status,
      normalRange,
      units,
      notes,
      doctorName,
      labName,
      isAbnormal,
      attachments
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (result) updateData.result = result;
    if (date) updateData.date = date;
    if (testType) updateData.testType = testType;
    if (status) updateData.status = status;
    if (normalRange !== undefined) updateData.normalRange = normalRange;
    if (units !== undefined) updateData.units = units;
    if (notes !== undefined) updateData.notes = notes;
    if (doctorName !== undefined) updateData.doctorName = doctorName;
    if (labName !== undefined) updateData.labName = labName;
    if (isAbnormal !== undefined) updateData.isAbnormal = isAbnormal;
    if (attachments) updateData.attachments = attachments;

    await test.update(updateData);

    // Fetch updated test with user info
    const updatedTest = await DiagnosticTest.findByPk(test.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      message: 'Diagnostic test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update diagnostic test error:', error);
    res.status(500).json({
      message: 'Server error while updating diagnostic test'
    });
  }
});

// @route   PUT /api/diagnostic-tests/:id/review
// @desc    Mark diagnostic test as reviewed
// @access  Private
router.put('/:id/review', auth, async (req, res) => {
  try {
    const test = await DiagnosticTest.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!test) {
      return res.status(404).json({
        message: 'Diagnostic test not found'
      });
    }

    await test.markAsReviewed();

    res.json({
      message: 'Diagnostic test marked as reviewed',
      test
    });
  } catch (error) {
    console.error('Review test error:', error);
    res.status(500).json({
      message: 'Server error while reviewing test'
    });
  }
});

// @route   DELETE /api/diagnostic-tests/:id
// @desc    Delete diagnostic test
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const test = await DiagnosticTest.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!test) {
      return res.status(404).json({
        message: 'Diagnostic test not found'
      });
    }

    await test.destroy();

    res.json({
      message: 'Diagnostic test deleted successfully'
    });
  } catch (error) {
    console.error('Delete diagnostic test error:', error);
    res.status(500).json({
      message: 'Server error while deleting diagnostic test'
    });
  }
});

// @route   GET /api/diagnostic-tests/stats/summary
// @desc    Get diagnostic test statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const [total, abnormal, pending, completed, reviewed] = await Promise.all([
      DiagnosticTest.count({ where: { userId: req.user.id } }),
      DiagnosticTest.count({ where: { userId: req.user.id, isAbnormal: true } }),
      DiagnosticTest.count({ where: { userId: req.user.id, status: 'pending' } }),
      DiagnosticTest.count({ where: { userId: req.user.id, status: 'completed' } }),
      DiagnosticTest.count({ where: { userId: req.user.id, status: 'reviewed' } })
    ]);

    const typeStats = await DiagnosticTest.findAll({
      where: { userId: req.user.id },
      attributes: [
        'testType',
        [DiagnosticTest.sequelize.fn('COUNT', DiagnosticTest.sequelize.col('id')), 'count']
      ],
      group: ['testType'],
      raw: true
    });

    // Get recent tests count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCount = await DiagnosticTest.count({
      where: {
        userId: req.user.id,
        date: {
          [DiagnosticTest.sequelize.Sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      summary: {
        total,
        abnormal,
        recent: recentCount,
        byStatus: {
          pending,
          completed,
          reviewed
        },
        byType: typeStats.reduce((acc, item) => {
          acc[item.testType] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get test stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching test statistics'
    });
  }
});

module.exports = router;

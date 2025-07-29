const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Alert, User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/alerts
// @desc    Get user's alerts with pagination and filtering
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
  query('status')
    .optional()
    .isIn(['active', 'acknowledged', 'resolved', 'dismissed'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority filter'),
  query('type')
    .optional()
    .isIn(['general', 'health', 'system', 'diagnostic', 'reminder'])
    .withMessage('Invalid type filter')
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
    if (req.query.status) whereClause.status = req.query.status;
    if (req.query.priority) whereClause.priority = req.query.priority;
    if (req.query.type) whereClause.type = req.query.type;

    const { count, rows: alerts } = await Alert.findAndCountAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
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
      alerts,
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
    console.error('Get alerts error:', error);
    res.status(500).json({
      message: 'Server error while fetching alerts'
    });
  }
});

// @route   GET /api/alerts/active
// @desc    Get user's active alerts
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const alerts = await Alert.findActiveByUser(req.user.id);

    res.json({
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      message: 'Server error while fetching active alerts'
    });
  }
});

// @route   GET /api/alerts/:id
// @desc    Get specific alert
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
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

    if (!alert) {
      return res.status(404).json({
        message: 'Alert not found'
      });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({
      message: 'Server error while fetching alert'
    });
  }
});

// @route   POST /api/alerts
// @desc    Create new alert
// @access  Private
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('type')
    .optional()
    .isIn(['general', 'health', 'system', 'diagnostic', 'reminder'])
    .withMessage('Type must be general, health, system, diagnostic, or reminder'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
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

    const { title, message, priority, type, metadata } = req.body;

    const alert = await Alert.create({
      title,
      message,
      priority: priority || 'medium',
      type: type || 'general',
      metadata: metadata || {},
      userId: req.user.id
    });

    // Fetch the created alert with user info
    const createdAlert = await Alert.findByPk(alert.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json({
      message: 'Alert created successfully',
      alert: createdAlert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      message: 'Server error while creating alert'
    });
  }
});

// @route   PUT /api/alerts/:id
// @desc    Update alert
// @access  Private
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'acknowledged', 'resolved', 'dismissed'])
    .withMessage('Status must be active, acknowledged, resolved, or dismissed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('type')
    .optional()
    .isIn(['general', 'health', 'system', 'diagnostic', 'reminder'])
    .withMessage('Type must be general, health, system, diagnostic, or reminder')
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

    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({
        message: 'Alert not found'
      });
    }

    const { title, message, status, priority, type, metadata } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (status) {
      updateData.status = status;
      if (status === 'acknowledged' && !alert.acknowledgedAt) {
        updateData.acknowledgedAt = new Date();
      }
      if (status === 'resolved' && !alert.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (type) updateData.type = type;
    if (metadata) updateData.metadata = { ...alert.metadata, ...metadata };

    await alert.update(updateData);

    // Fetch updated alert with user info
    const updatedAlert = await Alert.findByPk(alert.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      message: 'Alert updated successfully',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({
      message: 'Server error while updating alert'
    });
  }
});

// @route   PUT /api/alerts/:id/acknowledge
// @desc    Acknowledge alert
// @access  Private
router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({
        message: 'Alert not found'
      });
    }

    await alert.acknowledge();

    res.json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      message: 'Server error while acknowledging alert'
    });
  }
});

// @route   PUT /api/alerts/:id/resolve
// @desc    Resolve alert
// @access  Private
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({
        message: 'Alert not found'
      });
    }

    await alert.resolve();

    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      message: 'Server error while resolving alert'
    });
  }
});

// @route   DELETE /api/alerts/:id
// @desc    Delete alert
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({
        message: 'Alert not found'
      });
    }

    await alert.destroy();

    res.json({
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      message: 'Server error while deleting alert'
    });
  }
});

// @route   GET /api/alerts/stats/summary
// @desc    Get alert statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const [total, active, acknowledged, resolved, dismissed] = await Promise.all([
      Alert.count({ where: { userId: req.user.id } }),
      Alert.count({ where: { userId: req.user.id, status: 'active' } }),
      Alert.count({ where: { userId: req.user.id, status: 'acknowledged' } }),
      Alert.count({ where: { userId: req.user.id, status: 'resolved' } }),
      Alert.count({ where: { userId: req.user.id, status: 'dismissed' } })
    ]);

    const priorityStats = await Alert.findAll({
      where: { userId: req.user.id },
      attributes: [
        'priority',
        [Alert.sequelize.fn('COUNT', Alert.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    res.json({
      summary: {
        total,
        byStatus: {
          active,
          acknowledged,
          resolved,
          dismissed
        },
        byPriority: priorityStats.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching alert statistics'
    });
  }
});

module.exports = router;

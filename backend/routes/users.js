const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
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

    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already taken by another user'
        });
      }
      updateData.email = email;
    }

    // Update user
    await req.user.update(updateData);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        preferences: req.user.preferences,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('notificationThreshold')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Notification threshold must be low, medium, or high'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de'])
    .withMessage('Language must be en, es, fr, or de')
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

    const { notificationThreshold, emailNotifications, theme, language } = req.body;
    
    // Get current preferences
    const currentPreferences = req.user.preferences || {};
    
    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(notificationThreshold && { notificationThreshold }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(theme && { theme }),
      ...(language && { language })
    };

    await req.user.update({ preferences: updatedPreferences });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      message: 'Server error while updating preferences'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', [
  auth,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
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

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await req.user.update({ password: newPassword });

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error while changing password'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    await req.user.update({ isActive: false });

    res.json({
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      message: 'Server error while deactivating account'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { Alert, DiagnosticTest } = require('../models');
    
    const [alertsCount, testsCount, activeAlertsCount] = await Promise.all([
      Alert.count({ where: { userId: req.user.id } }),
      DiagnosticTest.count({ where: { userId: req.user.id } }),
      Alert.count({ where: { userId: req.user.id, status: 'active' } })
    ]);

    res.json({
      stats: {
        totalAlerts: alertsCount,
        activeAlerts: activeAlertsCount,
        totalTests: testsCount,
        memberSince: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;

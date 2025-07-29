const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'dismissed'),
    defaultValue: 'active',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    validate: {
      isIn: [['general', 'health', 'system', 'diagnostic', 'reminder']]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Alert.prototype.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  return this.save();
};

Alert.prototype.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

Alert.prototype.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

// Class methods
Alert.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Alert.findActiveByUser = function(userId) {
  return this.findAll({
    where: { 
      userId,
      status: 'active'
    },
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

module.exports = Alert;

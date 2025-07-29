const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DiagnosticTest = sequelize.define('DiagnosticTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      notEmpty: true
    }
  },
  testType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'general',
    validate: {
      isIn: [['blood', 'urine', 'imaging', 'cardiac', 'neurological', 'genetic', 'general']]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'reviewed', 'cancelled'),
    defaultValue: 'completed',
    allowNull: false
  },
  normalRange: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  units: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  labName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isAbnormal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'diagnostic_tests',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['test_type']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
DiagnosticTest.prototype.markAsReviewed = function() {
  this.status = 'reviewed';
  return this.save();
};

DiagnosticTest.prototype.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Class methods
DiagnosticTest.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { userId },
    order: [['date', 'DESC']],
    ...options
  });
};

DiagnosticTest.findByUserAndType = function(userId, testType) {
  return this.findAll({
    where: { 
      userId,
      testType
    },
    order: [['date', 'DESC']]
  });
};

DiagnosticTest.findAbnormalByUser = function(userId) {
  return this.findAll({
    where: { 
      userId,
      isAbnormal: true
    },
    order: [['date', 'DESC']]
  });
};

DiagnosticTest.findRecentByUser = function(userId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.findAll({
    where: { 
      userId,
      date: {
        [sequelize.Sequelize.Op.gte]: dateThreshold
      }
    },
    order: [['date', 'DESC']]
  });
};

module.exports = DiagnosticTest;

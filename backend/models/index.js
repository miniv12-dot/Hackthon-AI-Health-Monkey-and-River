const { sequelize } = require('../config/database');
const User = require('./User');
const Alert = require('./Alert');
const DiagnosticTest = require('./DiagnosticTest');

// Define associations
User.hasMany(Alert, {
  foreignKey: 'userId',
  as: 'alerts',
  onDelete: 'CASCADE'
});

Alert.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(DiagnosticTest, {
  foreignKey: 'userId',
  as: 'diagnosticTests',
  onDelete: 'CASCADE'
});

DiagnosticTest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Alert,
  DiagnosticTest
};

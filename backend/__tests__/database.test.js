const { sequelize, testConnection } = require('../config/database');
const { User, Alert, DiagnosticTest } = require('../models');

describe('Database Connection and Models', () => {
  beforeAll(async () => {
    // Test database connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const isConnected = await testConnection();
      expect(isConnected).toBe(true);
    });

    it('should authenticate with database', async () => {
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });
  });

  describe('Database Models', () => {
    beforeAll(async () => {
      // Sync database models
      await sequelize.sync({ force: true });
    });

    afterEach(async () => {
      // Clean up after each test
      await DiagnosticTest.destroy({ where: {} });
      await Alert.destroy({ where: {} });
      await User.destroy({ where: {} });
    });

    describe('User Model', () => {
      it('should create a user successfully', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        };

        const user = await User.create(userData);

        expect(user.id).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Should be hashed
        expect(user.isActive).toBe(true);
        expect(user.preferences).toBeDefined();
      });

      it('should hash password before saving', async () => {
        const userData = {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'plainpassword'
        };

        const user = await User.create(userData);
        expect(user.password).not.toBe('plainpassword');
        expect(user.password.length).toBeGreaterThan(50); // Hashed password is longer
      });

      it('should validate password correctly', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpassword'
        };

        const user = await User.create(userData);
        const isValid = await user.comparePassword('testpassword');
        const isInvalid = await user.comparePassword('wrongpassword');

        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });

      it('should not include password in JSON output', async () => {
        const userData = {
          name: 'JSON Test',
          email: 'json@example.com',
          password: 'password123'
        };

        const user = await User.create(userData);
        const userJSON = user.toJSON();

        expect(userJSON.password).toBeUndefined();
        expect(userJSON.name).toBe(userData.name);
        expect(userJSON.email).toBe(userData.email);
      });

      it('should find user by email', async () => {
        const userData = {
          name: 'Find Test',
          email: 'find@example.com',
          password: 'password123'
        };

        await User.create(userData);
        const foundUser = await User.findByEmail('find@example.com');

        expect(foundUser).toBeDefined();
        expect(foundUser.email).toBe(userData.email);
      });

      it('should enforce email uniqueness', async () => {
        const userData = {
          name: 'Unique Test',
          email: 'unique@example.com',
          password: 'password123'
        };

        await User.create(userData);

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should validate email format', async () => {
        const userData = {
          name: 'Email Test',
          email: 'invalid-email',
          password: 'password123'
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should validate password length', async () => {
        const userData = {
          name: 'Password Test',
          email: 'password@example.com',
          password: '123' // Too short
        };

        await expect(User.create(userData)).rejects.toThrow();
      });
    });

    describe('Alert Model', () => {
      let testUser;

      beforeEach(async () => {
        testUser = await User.create({
          name: 'Alert Test User',
          email: 'alert@example.com',
          password: 'password123'
        });
      });

      it('should create an alert successfully', async () => {
        const alertData = {
          title: 'Test Alert',
          message: 'This is a test alert',
          priority: 'medium',
          type: 'general',
          userId: testUser.id
        };

        const alert = await Alert.create(alertData);

        expect(alert.id).toBeDefined();
        expect(alert.title).toBe(alertData.title);
        expect(alert.message).toBe(alertData.message);
        expect(alert.status).toBe('active'); // Default status
        expect(alert.userId).toBe(testUser.id);
      });

      it('should acknowledge alert correctly', async () => {
        const alert = await Alert.create({
          title: 'Acknowledge Test',
          userId: testUser.id
        });

        await alert.acknowledge();

        expect(alert.status).toBe('acknowledged');
        expect(alert.acknowledgedAt).toBeDefined();
      });

      it('should resolve alert correctly', async () => {
        const alert = await Alert.create({
          title: 'Resolve Test',
          userId: testUser.id
        });

        await alert.resolve();

        expect(alert.status).toBe('resolved');
        expect(alert.resolvedAt).toBeDefined();
      });

      it('should find alerts by user', async () => {
        await Alert.create({
          title: 'User Alert 1',
          userId: testUser.id
        });

        await Alert.create({
          title: 'User Alert 2',
          userId: testUser.id
        });

        const userAlerts = await Alert.findByUser(testUser.id);

        expect(userAlerts).toHaveLength(2);
        expect(userAlerts[0].userId).toBe(testUser.id);
        expect(userAlerts[1].userId).toBe(testUser.id);
      });

      it('should find active alerts by user', async () => {
        await Alert.create({
          title: 'Active Alert',
          status: 'active',
          userId: testUser.id
        });

        await Alert.create({
          title: 'Resolved Alert',
          status: 'resolved',
          userId: testUser.id
        });

        const activeAlerts = await Alert.findActiveByUser(testUser.id);

        expect(activeAlerts).toHaveLength(1);
        expect(activeAlerts[0].status).toBe('active');
      });

      it('should validate required fields', async () => {
        await expect(Alert.create({
          // Missing title and userId
          message: 'Test message'
        })).rejects.toThrow();
      });

      it('should validate enum values', async () => {
        await expect(Alert.create({
          title: 'Invalid Status',
          status: 'invalid_status',
          userId: testUser.id
        })).rejects.toThrow();

        await expect(Alert.create({
          title: 'Invalid Priority',
          priority: 'invalid_priority',
          userId: testUser.id
        })).rejects.toThrow();
      });
    });

    describe('DiagnosticTest Model', () => {
      let testUser;

      beforeEach(async () => {
        testUser = await User.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      });

      it('should create a diagnostic test successfully', async () => {
        const testData = {
          name: 'Blood Test',
          result: 'Normal values',
          date: '2023-12-01',
          testType: 'blood',
          userId: testUser.id
        };

        const diagnosticTest = await DiagnosticTest.create(testData);

        expect(diagnosticTest.id).toBeDefined();
        expect(diagnosticTest.name).toBe(testData.name);
        expect(diagnosticTest.result).toBe(testData.result);
        expect(diagnosticTest.date).toBe(testData.date);
        expect(diagnosticTest.testType).toBe(testData.testType);
        expect(diagnosticTest.status).toBe('completed'); // Default status
        expect(diagnosticTest.userId).toBe(testUser.id);
      });

      it('should mark test as reviewed', async () => {
        const test = await DiagnosticTest.create({
          name: 'Review Test',
          result: 'Test result',
          date: '2023-12-01',
          userId: testUser.id
        });

        await test.markAsReviewed();

        expect(test.status).toBe('reviewed');
      });

      it('should cancel test', async () => {
        const test = await DiagnosticTest.create({
          name: 'Cancel Test',
          result: 'Test result',
          date: '2023-12-01',
          userId: testUser.id
        });

        await test.cancel();

        expect(test.status).toBe('cancelled');
      });

      it('should find tests by user', async () => {
        await DiagnosticTest.create({
          name: 'User Test 1',
          result: 'Result 1',
          date: '2023-12-01',
          userId: testUser.id
        });

        await DiagnosticTest.create({
          name: 'User Test 2',
          result: 'Result 2',
          date: '2023-12-02',
          userId: testUser.id
        });

        const userTests = await DiagnosticTest.findByUser(testUser.id);

        expect(userTests).toHaveLength(2);
        expect(userTests[0].userId).toBe(testUser.id);
        expect(userTests[1].userId).toBe(testUser.id);
      });

      it('should find abnormal tests by user', async () => {
        await DiagnosticTest.create({
          name: 'Normal Test',
          result: 'Normal',
          date: '2023-12-01',
          isAbnormal: false,
          userId: testUser.id
        });

        await DiagnosticTest.create({
          name: 'Abnormal Test',
          result: 'Abnormal',
          date: '2023-12-02',
          isAbnormal: true,
          userId: testUser.id
        });

        const abnormalTests = await DiagnosticTest.findAbnormalByUser(testUser.id);

        expect(abnormalTests).toHaveLength(1);
        expect(abnormalTests[0].isAbnormal).toBe(true);
      });

      it('should validate required fields', async () => {
        await expect(DiagnosticTest.create({
          // Missing name, result, date, and userId
          testType: 'blood'
        })).rejects.toThrow();
      });

      it('should validate enum values', async () => {
        await expect(DiagnosticTest.create({
          name: 'Invalid Type Test',
          result: 'Result',
          date: '2023-12-01',
          testType: 'invalid_type',
          userId: testUser.id
        })).rejects.toThrow();

        await expect(DiagnosticTest.create({
          name: 'Invalid Status Test',
          result: 'Result',
          date: '2023-12-01',
          status: 'invalid_status',
          userId: testUser.id
        })).rejects.toThrow();
      });

      it('should validate date format', async () => {
        await expect(DiagnosticTest.create({
          name: 'Invalid Date Test',
          result: 'Result',
          date: 'invalid-date',
          userId: testUser.id
        })).rejects.toThrow();
      });
    });

    describe('Model Associations', () => {
      let testUser;

      beforeEach(async () => {
        testUser = await User.create({
          name: 'Association Test User',
          email: 'association@example.com',
          password: 'password123'
        });
      });

      it('should establish User-Alert association', async () => {
        const alert = await Alert.create({
          title: 'Association Test Alert',
          userId: testUser.id
        });

        const userWithAlerts = await User.findByPk(testUser.id, {
          include: [{ model: Alert, as: 'alerts' }]
        });

        const alertWithUser = await Alert.findByPk(alert.id, {
          include: [{ model: User, as: 'user' }]
        });

        expect(userWithAlerts.alerts).toHaveLength(1);
        expect(userWithAlerts.alerts[0].title).toBe('Association Test Alert');
        expect(alertWithUser.user.name).toBe(testUser.name);
      });

      it('should establish User-DiagnosticTest association', async () => {
        const test = await DiagnosticTest.create({
          name: 'Association Test',
          result: 'Test result',
          date: '2023-12-01',
          userId: testUser.id
        });

        const userWithTests = await User.findByPk(testUser.id, {
          include: [{ model: DiagnosticTest, as: 'diagnosticTests' }]
        });

        const testWithUser = await DiagnosticTest.findByPk(test.id, {
          include: [{ model: User, as: 'user' }]
        });

        expect(userWithTests.diagnosticTests).toHaveLength(1);
        expect(userWithTests.diagnosticTests[0].name).toBe('Association Test');
        expect(testWithUser.user.name).toBe(testUser.name);
      });

      it('should cascade delete on user deletion', async () => {
        await Alert.create({
          title: 'Cascade Test Alert',
          userId: testUser.id
        });

        await DiagnosticTest.create({
          name: 'Cascade Test',
          result: 'Test result',
          date: '2023-12-01',
          userId: testUser.id
        });

        // Delete user
        await testUser.destroy();

        // Check that associated records are deleted
        const remainingAlerts = await Alert.findAll({ where: { userId: testUser.id } });
        const remainingTests = await DiagnosticTest.findAll({ where: { userId: testUser.id } });

        expect(remainingAlerts).toHaveLength(0);
        expect(remainingTests).toHaveLength(0);
      });
    });
  });
});

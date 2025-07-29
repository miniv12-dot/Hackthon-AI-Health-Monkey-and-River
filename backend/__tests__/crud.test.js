const request = require('supertest');
const app = require('../server');
const { sequelize, User, Alert, DiagnosticTest } = require('../models');

describe('CRUD Operations', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Sync database for testing
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await DiagnosticTest.destroy({ where: {} });
    await Alert.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test user and get auth token
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('User Profile CRUD', () => {
    describe('GET /api/users/profile', () => {
      it('should get user profile successfully', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.user.id).toBe(testUser.id);
        expect(response.body.user.name).toBe(testUser.name);
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.password).toBeUndefined();
      });

      it('should not get profile without authentication', async () => {
        await request(app)
          .get('/api/users/profile')
          .expect(401);
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile successfully', async () => {
        const updateData = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Profile updated successfully');
        expect(response.body.user.name).toBe(updateData.name);
        expect(response.body.user.email).toBe(updateData.email);
      });

      it('should not update with invalid email', async () => {
        const updateData = {
          email: 'invalid-email'
        };

        await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);
      });

      it('should not update with duplicate email', async () => {
        // Create another user
        await User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

        const updateData = {
          email: 'another@example.com'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toBe('Email is already taken by another user');
      });
    });

    describe('PUT /api/users/preferences', () => {
      it('should update user preferences successfully', async () => {
        const preferencesData = {
          notificationThreshold: 'high',
          emailNotifications: false,
          theme: 'dark',
          language: 'es'
        };

        const response = await request(app)
          .put('/api/users/preferences')
          .set('Authorization', `Bearer ${authToken}`)
          .send(preferencesData)
          .expect(200);

        expect(response.body.message).toBe('Preferences updated successfully');
        expect(response.body.preferences.notificationThreshold).toBe('high');
        expect(response.body.preferences.emailNotifications).toBe(false);
        expect(response.body.preferences.theme).toBe('dark');
        expect(response.body.preferences.language).toBe('es');
      });

      it('should validate preference values', async () => {
        const invalidPreferences = {
          notificationThreshold: 'invalid',
          theme: 'invalid'
        };

        await request(app)
          .put('/api/users/preferences')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidPreferences)
          .expect(400);
      });
    });

    describe('PUT /api/users/password', () => {
      it('should change password successfully', async () => {
        const passwordData = {
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        };

        const response = await request(app)
          .put('/api/users/password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData)
          .expect(200);

        expect(response.body.message).toBe('Password changed successfully');

        // Verify new password works
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'newpassword123'
          })
          .expect(200);

        expect(loginResponse.body.token).toBeDefined();
      });

      it('should not change password with wrong current password', async () => {
        const passwordData = {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        };

        const response = await request(app)
          .put('/api/users/password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData)
          .expect(400);

        expect(response.body.message).toBe('Current password is incorrect');
      });

      it('should not change password with mismatched confirmation', async () => {
        const passwordData = {
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword'
        };

        await request(app)
          .put('/api/users/password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData)
          .expect(400);
      });
    });
  });

  describe('Alerts CRUD', () => {
    describe('POST /api/alerts', () => {
      it('should create alert successfully', async () => {
        const alertData = {
          title: 'Test Alert',
          message: 'This is a test alert',
          priority: 'high',
          type: 'health'
        };

        const response = await request(app)
          .post('/api/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(alertData)
          .expect(201);

        expect(response.body.message).toBe('Alert created successfully');
        expect(response.body.alert.title).toBe(alertData.title);
        expect(response.body.alert.message).toBe(alertData.message);
        expect(response.body.alert.priority).toBe(alertData.priority);
        expect(response.body.alert.type).toBe(alertData.type);
        expect(response.body.alert.userId).toBe(testUser.id);
      });

      it('should validate required fields', async () => {
        const invalidAlertData = {
          message: 'Missing title'
        };

        await request(app)
          .post('/api/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidAlertData)
          .expect(400);
      });
    });

    describe('GET /api/alerts', () => {
      beforeEach(async () => {
        // Create test alerts
        await Alert.bulkCreate([
          {
            title: 'Alert 1',
            message: 'Message 1',
            priority: 'high',
            type: 'health',
            status: 'active',
            userId: testUser.id
          },
          {
            title: 'Alert 2',
            message: 'Message 2',
            priority: 'medium',
            type: 'general',
            status: 'resolved',
            userId: testUser.id
          }
        ]);
      });

      it('should get user alerts with pagination', async () => {
        const response = await request(app)
          .get('/api/alerts?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.alerts).toHaveLength(2);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalItems).toBe(2);
      });

      it('should filter alerts by status', async () => {
        const response = await request(app)
          .get('/api/alerts?status=active')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.alerts).toHaveLength(1);
        expect(response.body.alerts[0].status).toBe('active');
      });

      it('should filter alerts by priority', async () => {
        const response = await request(app)
          .get('/api/alerts?priority=high')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.alerts).toHaveLength(1);
        expect(response.body.alerts[0].priority).toBe('high');
      });
    });

    describe('GET /api/alerts/:id', () => {
      let testAlert;

      beforeEach(async () => {
        testAlert = await Alert.create({
          title: 'Specific Alert',
          message: 'Specific message',
          userId: testUser.id
        });
      });

      it('should get specific alert', async () => {
        const response = await request(app)
          .get(`/api/alerts/${testAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.alert.id).toBe(testAlert.id);
        expect(response.body.alert.title).toBe(testAlert.title);
      });

      it('should not get alert that does not belong to user', async () => {
        // Create another user and alert
        const anotherUser = await User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

        const anotherAlert = await Alert.create({
          title: 'Another Alert',
          userId: anotherUser.id
        });

        await request(app)
          .get(`/api/alerts/${anotherAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/alerts/:id', () => {
      let testAlert;

      beforeEach(async () => {
        testAlert = await Alert.create({
          title: 'Original Title',
          message: 'Original message',
          userId: testUser.id
        });
      });

      it('should update alert successfully', async () => {
        const updateData = {
          title: 'Updated Title',
          message: 'Updated message',
          priority: 'high',
          status: 'acknowledged'
        };

        const response = await request(app)
          .put(`/api/alerts/${testAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Alert updated successfully');
        expect(response.body.alert.title).toBe(updateData.title);
        expect(response.body.alert.message).toBe(updateData.message);
        expect(response.body.alert.priority).toBe(updateData.priority);
        expect(response.body.alert.status).toBe(updateData.status);
      });

      it('should set acknowledgedAt when status is acknowledged', async () => {
        const updateData = {
          status: 'acknowledged'
        };

        const response = await request(app)
          .put(`/api/alerts/${testAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.alert.acknowledgedAt).toBeDefined();
      });
    });

    describe('DELETE /api/alerts/:id', () => {
      let testAlert;

      beforeEach(async () => {
        testAlert = await Alert.create({
          title: 'Delete Test Alert',
          userId: testUser.id
        });
      });

      it('should delete alert successfully', async () => {
        const response = await request(app)
          .delete(`/api/alerts/${testAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.message).toBe('Alert deleted successfully');

        // Verify alert is deleted
        const deletedAlert = await Alert.findByPk(testAlert.id);
        expect(deletedAlert).toBeNull();
      });

      it('should not delete alert that does not belong to user', async () => {
        const anotherUser = await User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

        const anotherAlert = await Alert.create({
          title: 'Another Alert',
          userId: anotherUser.id
        });

        await request(app)
          .delete(`/api/alerts/${anotherAlert.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  describe('DiagnosticTests CRUD', () => {
    describe('POST /api/diagnostic-tests', () => {
      it('should create diagnostic test successfully', async () => {
        const testData = {
          name: 'Blood Test',
          result: 'Normal values',
          date: '2023-12-01',
          testType: 'blood',
          status: 'completed',
          normalRange: '4.0-11.0 K/uL',
          units: 'K/uL',
          notes: 'All values within normal range',
          doctorName: 'Dr. Smith',
          labName: 'Central Lab',
          isAbnormal: false
        };

        const response = await request(app)
          .post('/api/diagnostic-tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData)
          .expect(201);

        expect(response.body.message).toBe('Diagnostic test created successfully');
        expect(response.body.test.name).toBe(testData.name);
        expect(response.body.test.result).toBe(testData.result);
        expect(response.body.test.date).toBe(testData.date);
        expect(response.body.test.testType).toBe(testData.testType);
        expect(response.body.test.userId).toBe(testUser.id);
      });

      it('should validate required fields', async () => {
        const invalidTestData = {
          result: 'Missing name and date'
        };

        await request(app)
          .post('/api/diagnostic-tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidTestData)
          .expect(400);
      });

      it('should validate date format', async () => {
        const invalidTestData = {
          name: 'Test',
          result: 'Result',
          date: 'invalid-date'
        };

        await request(app)
          .post('/api/diagnostic-tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidTestData)
          .expect(400);
      });
    });

    describe('GET /api/diagnostic-tests', () => {
      beforeEach(async () => {
        // Create test diagnostic tests
        await DiagnosticTest.bulkCreate([
          {
            name: 'Blood Test 1',
            result: 'Normal',
            date: '2023-12-01',
            testType: 'blood',
            status: 'completed',
            isAbnormal: false,
            userId: testUser.id
          },
          {
            name: 'Urine Test 1',
            result: 'Abnormal',
            date: '2023-12-02',
            testType: 'urine',
            status: 'reviewed',
            isAbnormal: true,
            userId: testUser.id
          }
        ]);
      });

      it('should get user diagnostic tests with pagination', async () => {
        const response = await request(app)
          .get('/api/diagnostic-tests?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.tests).toHaveLength(2);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalItems).toBe(2);
      });

      it('should filter tests by type', async () => {
        const response = await request(app)
          .get('/api/diagnostic-tests?testType=blood')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.tests).toHaveLength(1);
        expect(response.body.tests[0].testType).toBe('blood');
      });

      it('should filter tests by abnormal status', async () => {
        const response = await request(app)
          .get('/api/diagnostic-tests?isAbnormal=true')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.tests).toHaveLength(1);
        expect(response.body.tests[0].isAbnormal).toBe(true);
      });
    });

    describe('GET /api/diagnostic-tests/:id', () => {
      let testDiagnostic;

      beforeEach(async () => {
        testDiagnostic = await DiagnosticTest.create({
          name: 'Specific Test',
          result: 'Specific result',
          date: '2023-12-01',
          userId: testUser.id
        });
      });

      it('should get specific diagnostic test', async () => {
        const response = await request(app)
          .get(`/api/diagnostic-tests/${testDiagnostic.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.test.id).toBe(testDiagnostic.id);
        expect(response.body.test.name).toBe(testDiagnostic.name);
      });

      it('should not get test that does not belong to user', async () => {
        const anotherUser = await User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

        const anotherTest = await DiagnosticTest.create({
          name: 'Another Test',
          result: 'Result',
          date: '2023-12-01',
          userId: anotherUser.id
        });

        await request(app)
          .get(`/api/diagnostic-tests/${anotherTest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/diagnostic-tests/:id', () => {
      let testDiagnostic;

      beforeEach(async () => {
        testDiagnostic = await DiagnosticTest.create({
          name: 'Original Test',
          result: 'Original result',
          date: '2023-12-01',
          userId: testUser.id
        });
      });

      it('should update diagnostic test successfully', async () => {
        const updateData = {
          name: 'Updated Test',
          result: 'Updated result',
          testType: 'blood',
          status: 'reviewed',
          isAbnormal: true,
          notes: 'Updated notes'
        };

        const response = await request(app)
          .put(`/api/diagnostic-tests/${testDiagnostic.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Diagnostic test updated successfully');
        expect(response.body.test.name).toBe(updateData.name);
        expect(response.body.test.result).toBe(updateData.result);
        expect(response.body.test.testType).toBe(updateData.testType);
        expect(response.body.test.status).toBe(updateData.status);
        expect(response.body.test.isAbnormal).toBe(updateData.isAbnormal);
      });

      it('should validate enum values', async () => {
        const updateData = {
          testType: 'invalid_type',
          status: 'invalid_status'
        };

        await request(app)
          .put(`/api/diagnostic-tests/${testDiagnostic.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);
      });
    });

    describe('DELETE /api/diagnostic-tests/:id', () => {
      let testDiagnostic;

      beforeEach(async () => {
        testDiagnostic = await DiagnosticTest.create({
          name: 'Delete Test',
          result: 'Result',
          date: '2023-12-01',
          userId: testUser.id
        });
      });

      it('should delete diagnostic test successfully', async () => {
        const response = await request(app)
          .delete(`/api/diagnostic-tests/${testDiagnostic.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.message).toBe('Diagnostic test deleted successfully');

        // Verify test is deleted
        const deletedTest = await DiagnosticTest.findByPk(testDiagnostic.id);
        expect(deletedTest).toBeNull();
      });

      it('should not delete test that does not belong to user', async () => {
        const anotherUser = await User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

        const anotherTest = await DiagnosticTest.create({
          name: 'Another Test',
          result: 'Result',
          date: '2023-12-01',
          userId: anotherUser.id
        });

        await request(app)
          .delete(`/api/diagnostic-tests/${anotherTest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  describe('Protected Routes', () => {
    it('should protect all user routes', async () => {
      await request(app).get('/api/users/profile').expect(401);
      await request(app).put('/api/users/profile').expect(401);
      await request(app).put('/api/users/preferences').expect(401);
      await request(app).put('/api/users/password').expect(401);
    });

    it('should protect all alert routes', async () => {
      await request(app).get('/api/alerts').expect(401);
      await request(app).post('/api/alerts').expect(401);
      await request(app).get('/api/alerts/1').expect(401);
      await request(app).put('/api/alerts/1').expect(401);
      await request(app).delete('/api/alerts/1').expect(401);
    });

    it('should protect all diagnostic test routes', async () => {
      await request(app).get('/api/diagnostic-tests').expect(401);
      await request(app).post('/api/diagnostic-tests').expect(401);
      await request(app).get('/api/diagnostic-tests/1').expect(401);
      await request(app).put('/api/diagnostic-tests/1').expect(401);
      await request(app).delete('/api/diagnostic-tests/1').expect(401);
    });
  });
});

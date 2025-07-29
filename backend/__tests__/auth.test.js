const request = require('supertest');
const app = require('../server');
const { sequelize, User } = require('../models');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Sync database for testing
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await User.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should not login inactive user', async () => {
      // Deactivate user
      await User.update({ isActive: false }, { where: { email: 'john@example.com' } });

      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Account is deactivated. Please contact support.');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create and login user
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe('john@example.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Access denied. Invalid token.');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should not logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(authToken);
    });

    it('should not refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });
});

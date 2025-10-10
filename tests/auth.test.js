// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Mock the auth middleware
jest.mock('../src/middlewares/auth.middleware.js', () => ({
  verifyToken: (req, res, next) => {
    // Mock user based on a test header
    if (req.headers['x-test-user-role'] === 'admin') {
      req.user = { id: 1, role: 'admin' };
    } else {
      req.user = { id: 2, role: 'user' };
    }
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  },
  isReporter: (req, res, next) => next(),
  isEditor: (req, res, next) => next(),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt_token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid_token') {
      return { userId: 1, role: 'user', type: 'invite' };
    } else if (token === 'invalid_token') {
      return { userId: 1, role: 'user', type: 'invalid' };
    }
    return { userId: 1, role: 'user', type: 'invite' };
  })
}));

const request = require('supertest');
const { app } = require('../src/server');
const { User, sequelize } = require('../src/models');

describe('Auth API', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4017);
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.userId).toBeDefined();

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user).not.toBeNull();
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('user');
      expect(user.status).toBe('active');
    });

    it('should return 400 if user already exists', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        status: 'active'
      });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // Create a user first
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        status: 'active'
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.token).toBe('jwt_token');
      expect(res.body.userId).toBeDefined();
      expect(res.body.role).toBe('user');
    });

    it('should return 404 if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 403 if user account is not active', async () => {
      // Create an inactive user
      await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'hashed_password',
        role: 'user',
        status: 'pending'
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('User account is not active');
    });

    it('should return 400 for invalid credentials', async () => {
      // Mock bcrypt.compare to return false
      require('bcryptjs').compare.mockResolvedValueOnce(false);

      // Create a user first
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        status: 'active'
      });

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/accept-invite/:token', () => {
    it('should accept an invitation and activate account', async () => {
      // Create a pending user
      const user = await User.create({
        id: 1,
        email: 'pending@example.com',
        role: 'editor',
        status: 'pending',
        invitedBy: 1
      });

      const res = await request(app)
        .post('/api/auth/accept-invite/valid_token')
        .send({
          name: 'Pending User',
          password: 'newpassword123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Account activated successfully!');
      expect(res.body.token).toBe('jwt_token');

      // Check that user is now active
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.status).toBe('active');
      expect(updatedUser.name).toBe('Pending User');
    });

    it('should return 400 for invalid token type', async () => {
      // Create a pending user
      await User.create({
        id: 1,
        email: 'pending@example.com',
        role: 'editor',
        status: 'pending',
        invitedBy: 1
      });

      const res = await request(app)
        .post('/api/auth/accept-invite/invalid_token')
        .send({
          name: 'Pending User',
          password: 'newpassword123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid token type.');
    });
  });
});
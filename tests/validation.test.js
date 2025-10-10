// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Mock the auth middleware
jest.mock('../src/middlewares/auth.middleware.js', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  isAdmin: (req, res, next) => next(),
  isReporter: (req, res, next) => next(),
  isEditor: (req, res, next) => next(),
}));

const request = require('supertest');
const { app } = require('../src/server');
const { User, sequelize } = require('../src/models');

describe('Validation Middleware', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4016);
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
    it('should return 400 if name is missing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 400 if email is invalid', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 400 if password is too short', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is invalid', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 400 if password is missing', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/admin/invite', () => {
    it('should return 400 if role is invalid', async () => {
      const inviteData = {
        email: 'test@example.com',
        role: 'invalid-role'
      };

      const res = await request(app)
        .post('/api/admin/invite')
        .send(inviteData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
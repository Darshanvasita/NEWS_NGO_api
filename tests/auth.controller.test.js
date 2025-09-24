const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../src/models');

jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 1 });
      bcrypt.hash.mockResolvedValue('hashedpassword');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpassword', role: 'user', status: 'active' };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 404 if user not found', async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
    });

    it('should return 403 if user is not active', async () => {
        const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpassword', role: 'user', status: 'inactive' };
        User.findOne.mockResolvedValue(mockUser);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('User account is not active');
    });

    it('should return 400 for invalid credentials', async () => {
        const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpassword', role: 'user', status: 'active' };
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('acceptInvite', () => {
    it('should activate a user account successfully', async () => {
        const mockUser = {
            id: 1,
            status: 'pending',
            save: jest.fn().mockResolvedValue({ id: 1, role: 'editor', status: 'active' }),
        };
        User.findByPk.mockResolvedValue(mockUser);
        bcrypt.hash.mockResolvedValue('newhashedpassword');
        const token = jwt.sign({ userId: 1, type: 'invite' }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const response = await request(app)
            .post(`/api/auth/accept-invite/${token}`)
            .send({ name: 'New User', password: 'newpassword' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Account activated successfully!');
        expect(response.body).toHaveProperty('token');
    });

    it('should return 401 if invitation token is expired', async () => {
      const expiredToken = jwt.sign({ userId: 1, type: 'invite' }, process.env.JWT_SECRET, { expiresIn: '-1s' });

      const response = await request(app)
        .post(`/api/auth/accept-invite/${expiredToken}`)
        .send({ name: 'Test User', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invitation link has expired.');
    });
  });
});

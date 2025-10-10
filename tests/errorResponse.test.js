// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Mock logger to prevent actual logging during tests
jest.mock('../src/config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

const request = require('supertest');
const { app } = require('../src/server');
const logger = require('../src/config/logger');

describe('Error Response Formats', () => {
  let server;

  beforeAll(() => {
    server = app.listen(4023);
  });

  afterAll(() => {
    server.close();
  });

  describe('Standardized Error Responses', () => {
    it('should return validation error format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // Too short
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('errors');
    });

    it('should have consistent error response structure', async () => {
      // Test multiple endpoints to ensure consistency
      const endpoints = [
        {
          method: 'post',
          url: '/api/auth/register',
          data: { email: 'invalid', password: '123' }
        },
        {
          method: 'post',
          url: '/api/auth/login',
          data: { email: 'invalid', password: '123' }
        }
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)
          [endpoint.method](endpoint.url)
          .send(endpoint.data)
          .expect(400);

        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
      }
    });
  });
});
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

describe('Security Enhancements', () => {
  let server;

  beforeAll(() => {
    server = app.listen(4024);
  });

  afterAll(() => {
    server.close();
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      // Check for security headers
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      // Helmet sets this to SAMEORIGIN by default
      expect(res.headers).toHaveProperty('x-frame-options');
    });
  });
});
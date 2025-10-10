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
const { News, sequelize } = require('../src/models');
const logger = require('../src/config/logger');

describe('Logging', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4021);
  });

  afterEach(async () => {
    await News.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('HTTP Request Logging', () => {
    it('should log HTTP requests', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.text).toBe('Server is running!');
      // Check that logger.stream.write was called
      expect(logger.stream.write).toHaveBeenCalled();
    });
  });

  describe('News API Logging', () => {
    it('should log news creation', async () => {
      const newsData = {
        title: 'Test News',
        description: 'Test Description',
        link: 'http://example.com'
      };

      const res = await request(app)
        .post('/api/news/add')
        .send(newsData)
        .expect(201);

      expect(res.body.message).toBe('News added successfully.');
      // Check that logger.info was called
      expect(logger.info).toHaveBeenCalled();
    });

    it('should log news fetching', async () => {
      // Create a news article first
      await News.create({
        title: 'Test News',
        description: 'Test Description',
        link: 'http://example.com',
        status: 'published',
        publishedAt: new Date()
      });

      const res = await request(app)
        .get('/api/news')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      // Check that logger.info was called
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
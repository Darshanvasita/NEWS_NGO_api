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
const { News, sequelize } = require('../src/models');

describe('Data Validation and Sanitization', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4022);
  });

  afterEach(async () => {
    await News.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('Input Sanitization', () => {
    it('should trim whitespace from input fields', async () => {
      const newsData = {
        title: '  Test News  ',
        description: '  Test Description  ',
        link: '  http://example.com  '
      };

      const res = await request(app)
        .post('/api/news/add')
        .send(newsData)
        .expect(201);

      expect(res.body.message).toBe('News added successfully.');
      expect(res.body.news.title).toBe('Test News');
      expect(res.body.news.description).toBe('Test Description');
      expect(res.body.news.link).toBe('http://example.com');
    });

    it('should validate required fields', async () => {
      const newsData = {
        title: '',
        description: 'Test Description'
        // Missing link field
      };

      const res = await request(app)
        .post('/api/news/add')
        .send(newsData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should validate URL format', async () => {
      const newsData = {
        title: 'Test News',
        description: 'Test Description',
        link: 'invalid-url'
      };

      const res = await request(app)
        .post('/api/news/add')
        .send(newsData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
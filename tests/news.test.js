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
      req.user = { id: 2, role: 'reporter' };
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
  isReporter: (req, res, next) => next(), // Add a mock for isReporter
  isEditor: (req, res, next) => next(), // Add a mock for isEditor
}));

const request = require('supertest');
const { app } = require('../src/server');
const { News, sequelize } = require('../src/models');

describe('News API - Admin', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4014);
  });

  afterEach(async () => {
    await News.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('POST /api/news/add', () => {
    it('should allow an admin to add a news article', async () => {
      const newsData = {
        title: 'Big News Today',
        description: 'Something major happened.',
        link: 'http://example.com/news/1',
      };

      const res = await request(app)
        .post('/api/news/add')
        .set('x-test-user-role', 'admin')
        .send(newsData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('News added successfully.');
      expect(res.body.news.title).toBe(newsData.title);

      const news = await News.findOne({ where: { title: 'Big News Today' } });
      expect(news).not.toBeNull();
      expect(news.status).toBe('published');
    });

    it('should not allow a non-admin to add a news article', async () => {
        const newsData = {
            title: 'Unauthorized News',
            description: 'This should not be added.',
            link: 'http://example.com/news/2',
        };

        const res = await request(app)
            .post('/api/news/add')
            .set('x-test-user-role', 'reporter')
            .send(newsData);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe('Access denied');
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/news/add')
            .set('x-test-user-role', 'admin')
            .send({ title: 'Incomplete News' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Title, description, and link are required.');
    });
  });
});
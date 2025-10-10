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
const { Story, sequelize } = require('../src/models');

describe('File Upload Integration', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4018);
  });

  afterEach(async () => {
    await Story.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('POST /api/ngo/stories', () => {
    it('should upload a story image and save the file path', async () => {
      const storyData = {
        title: 'Test Story',
        description: 'This is a test story'
      };

      const res = await request(app)
        .post('/api/ngo/stories')
        .field('title', storyData.title)
        .field('description', storyData.description)
        .attach('image', Buffer.from('fake image data'), 'test-image.jpg');

      expect(res.statusCode).toEqual(201);
      expect(res.body.title).toBe(storyData.title);
      // Check that imageUrl is a string and contains '/uploads/'
      expect(res.body.imageUrl).toMatch(/\/uploads\//);

      const story = await Story.findOne({ where: { title: 'Test Story' } });
      expect(story).not.toBeNull();
      expect(story.imageUrl).toMatch(/\/uploads\//);
    });
  });
});
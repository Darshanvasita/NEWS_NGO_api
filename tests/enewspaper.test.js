// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Mock the Cloudinary middleware to correctly parse multipart forms in tests
jest.mock('../src/config/cloudinary.js', () => {
  const multer = require('multer');
  const upload = multer(); // Use multer's default parsers

  // Return an object that mimics the real upload middleware
  return {
    single: (fieldName) => (req, res, next) => {
      // Use multer's .any() to parse text fields into req.body
      upload.any()(req, res, (err) => {
        if (err) return next(err);

        // Now that req.body is populated, manually add the mock file object
        req.file = {
          path: `https://fake.cloudinary.com/uploads/test-${Date.now()}.pdf`,
          filename: `test-${Date.now()}`,
        };
        next();
      });
    },
  };
});

// Mock the cloudinary library for the delete operation
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      destroy: jest.fn((publicId, options, callback) => {
        if (callback) callback(null, { result: 'ok' });
        return Promise.resolve({ result: 'ok' });
      }),
    },
  },
}));

const request = require('supertest');
const { app } = require('../src/server');
const { User, ENewspaper, sequelize } = require('../src/models');
const jwt = require('jsonwebtoken');
const path = require('path');

let server;
let token;
let userId;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';

  await sequelize.sync({ force: true });

  server = app.listen(4009);

  const user = await User.create({
    name: 'Test Editor',
    email: 'editor@test.com',
    password: 'password123',
    role: 'editor',
    status: 'active',
  });
  userId = user.id;

  token = jwt.sign({ id: userId, role: 'editor' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await sequelize.close();
  server.close();
});

describe('E-Newspaper API', () => {
  let eNewspaperId;

  it('should not allow an unauthenticated user to upload an e-newspaper', async () => {
    const res = await request(app)
      .post('/api/enewspapers')
      .field('publishDate', new Date().toISOString())
      .attach('file', path.resolve(__dirname, 'test-files', 'test.pdf'));

    expect(res.statusCode).toEqual(401);
  });

  it('should upload an e-newspaper for an authenticated editor', async () => {
    const res = await request(app)
      .post('/api/enewspapers')
      .set('Authorization', `Bearer ${token}`)
      .field('publishDate', new Date().toISOString())
      .attach('file', path.resolve(__dirname, 'test-files', 'test.pdf'));

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('filePath');
    eNewspaperId = res.body.id;
  });

  it('should get all e-newspapers for an authenticated editor', async () => {
    const res = await request(app)
      .get('/api/enewspapers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should get an e-newspaper by ID for an authenticated editor', async () => {
    const res = await request(app)
      .get(`/api/enewspapers/${eNewspaperId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', eNewspaperId);
  });

  it('should update an e-newspaper for an authenticated editor', async () => {
    const newPublishDate = new Date();
    newPublishDate.setDate(newPublishDate.getDate() + 1);

    const res = await request(app)
      .put(`/api/enewspapers/${eNewspaperId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ publishDate: newPublishDate.toISOString() });

    expect(res.statusCode).toEqual(200);
    expect(new Date(res.body.publishDate).getDate()).toEqual(newPublishDate.getDate());
  });

  describe('Public Access to Published E-Newspapers', () => {
    let yesterdayENewspaperId;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    beforeAll(async () => {
        await ENewspaper.destroy({ where: {} });

        // Create item 1 (published yesterday)
        const enewspaper1 = await ENewspaper.create({
            filePath: 'public/yesterday.pdf',
            publishDate: yesterday,
            userId: userId,
        });
        yesterdayENewspaperId = enewspaper1.id;

        // Create item 2 (published now)
        await ENewspaper.create({
            filePath: 'public/now.pdf',
            publishDate: new Date(),
            userId: userId,
        });

        // Create item 3 (published in the future, should not be returned)
        const futurePublishDate = new Date();
        futurePublishDate.setDate(futurePublishDate.getDate() + 5);
        await ENewspaper.create({
            filePath: 'future/test.pdf',
            publishDate: futurePublishDate,
            userId: userId,
        });
    });

    it('should get only published e-newspapers for the public', async () => {
        const res = await request(app).get('/api/enewspapers/public');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    it('should filter published e-newspapers by date', async () => {
        const res = await request(app).get(`/api/enewspapers/public?date=${yesterday.toISOString().split('T')[0]}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(yesterdayENewspaperId);
    });
  });

  it('should delete an e-newspaper for an authenticated editor', async () => {
    // Re-create the newspaper to ensure it exists before deletion
    const resCreate = await request(app)
      .post('/api/enewspapers')
      .set('Authorization', `Bearer ${token}`)
      .field('publishDate', new Date().toISOString())
      .attach('file', path.resolve(__dirname, 'test-files', 'test.pdf'));
    const idToDelete = resCreate.body.id;

    const res = await request(app)
      .delete(`/api/enewspapers/${idToDelete}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'E-Newspaper deleted successfully');
  });
});
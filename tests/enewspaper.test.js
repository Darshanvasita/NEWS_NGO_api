const request = require('supertest');
const { app } = require('../src/server');
const { User, ENewspaper, sequelize } = require('../src/models');
const jwt = require('jsonwebtoken');
const path = require('path');

let server;
let token;
let editor;

beforeAll(async () => {
  // Manually control the initialization order to prevent race conditions.
  // 1. Sync the database schema. The `sequelize` instance is mocked by setup.js.
  await sequelize.sync({ force: true });
  // 2. Start the server.
  server = app.listen(process.env.PORT || 4009);
});

afterAll(async () => {
  // Gracefully close the server and the database connection.
  if (server) {
    server.close();
  }
  await sequelize.close();
});

beforeEach(async () => {
  // Clean data from tables before each test, preserving the schema.
  // `restartIdentity` is important for SQLite to reset auto-incrementing IDs.
  await ENewspaper.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });

  // Re-create a test user and token for a clean state.
  editor = await User.create({
    name: 'Test Editor',
    email: 'editor@test.com',
    password: 'password123',
    role: 'editor',
    status: 'active',
  });
  token = jwt.sign({ id: editor.id, role: 'editor' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('E-Newspaper API', () => {
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
  });

  it('should get all e-newspapers for an authenticated editor', async () => {
    await ENewspaper.create({
        filePath: 'test.pdf',
        publishDate: new Date(),
        userId: editor.id,
    });
    const res = await request(app)
      .get('/api/enewspapers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
  });

  it('should update an e-newspaper', async () => {
    const eNewspaper = await ENewspaper.create({
        filePath: 'test.pdf',
        publishDate: new Date(),
        userId: editor.id,
    });
    const newPublishDate = new Date();
    newPublishDate.setDate(newPublishDate.getDate() + 1);

    const res = await request(app)
      .put(`/api/enewspapers/${eNewspaper.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ publishDate: newPublishDate.toISOString() });
    expect(res.statusCode).toEqual(200);
  });

  it('should delete an e-newspaper', async () => {
    const eNewspaper = await ENewspaper.create({
        filePath: 'test.pdf',
        publishDate: new Date(),
        userId: editor.id,
    });
    const res = await request(app)
      .delete(`/api/enewspapers/${eNewspaper.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });
});

describe('Public E-Newspaper Access', () => {
    it('should get only published e-newspapers for the public', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await ENewspaper.create({ filePath: 'public/yesterday.pdf', publishDate: yesterday, userId: editor.id });
        await ENewspaper.create({ filePath: 'public/now.pdf', publishDate: new Date(), userId: editor.id });

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        await ENewspaper.create({ filePath: 'future/test.pdf', publishDate: futureDate, userId: editor.id });

        const res = await request(app).get('/api/enewspapers/public');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(2);
    });
});
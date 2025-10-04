const request = require('supertest');
const { app } = require('../src/server');
const { User, News, NewsVersion, sequelize } = require('../src/models');
const jwt = require('jsonwebtoken');

let server;
let reporterToken, editorToken, adminToken;
let reporter, editor, admin;

beforeAll(async () => {
  // Manually control the initialization order to prevent race conditions.
  // 1. Sync the database schema. The `sequelize` instance is mocked by setup.js.
  await sequelize.sync({ force: true });
  // 2. Start the server.
  server = app.listen(process.env.PORT || 4010);
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
    // The order is important to avoid foreign key constraint errors.
    // `restartIdentity` is important for SQLite to reset auto-incrementing IDs.
    await NewsVersion.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await News.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });

    // Re-create users and tokens for a clean state for each test.
    [reporter, editor, admin] = await Promise.all([
        User.create({ name: 'Test Reporter', email: 'reporter@test.com', password: 'password', role: 'reporter', status: 'active' }),
        User.create({ name: 'Test Editor', email: 'editor@test.com', password: 'password', role: 'editor', status: 'active' }),
        User.create({ name: 'Test Admin', email: 'admin@test.com', password: 'password', role: 'admin', status: 'active' }),
    ]);

    reporterToken = jwt.sign({ id: reporter.id, role: 'reporter' }, process.env.JWT_SECRET);
    editorToken = jwt.sign({ id: editor.id, role: 'editor' }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET);
});

describe('News API Workflow', () => {
  it('should allow a reporter to create a news article as a draft', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ title: 'Test Article', content: 'This is a test.' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('draft');
  });

  it('should allow the authoring reporter to edit their own draft', async () => {
    const news = await News.create({ title: 'Original Title', content: 'Original content.', authorId: reporter.id, status: 'draft' });

    const res = await request(app)
      .put(`/api/news/${news.id}`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ title: 'Updated Title' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.news.title).toEqual('Updated Title');
  });

  it('should not allow a reporter to edit another reporter\'s article', async () => {
    const news = await News.create({ title: 'Another Article', authorId: admin.id, status: 'draft' });

    const res = await request(app)
      .put(`/api/news/${news.id}`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ title: 'Malicious Update' });

    expect(res.statusCode).toEqual(403);
  });

  it('should allow a reporter to submit an article for approval', async () => {
    const news = await News.create({ title: 'A story', authorId: reporter.id, status: 'draft' });
    const res = await request(app)
      .patch(`/api/news/${news.id}/submit`)
      .set('Authorization', `Bearer ${reporterToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.news.status).toEqual('pending_approval');
  });

  it('should allow an editor to approve an article', async () => {
    const news = await News.create({ title: 'A story', authorId: reporter.id, status: 'pending_approval' });
    const res = await request(app)
      .patch(`/api/news/${news.id}/approve`)
      .set('Authorization', `Bearer ${editorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.news.status).toEqual('published');
  });

  it('should allow an editor to schedule an article', async () => {
    const news = await News.create({ title: 'A story', authorId: reporter.id, status: 'pending_approval' });
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const res = await request(app)
      .patch(`/api/news/${news.id}/approve`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ publishedAt: futureDate.toISOString() });

    expect(res.statusCode).toEqual(200);
    expect(res.body.news.status).toEqual('scheduled');
  });

  it('should allow an editor to rollback an article', async () => {
    const news = await News.create({ title: 'Original Title', authorId: reporter.id, status: 'published' });
    const version = await NewsVersion.create({ newsId: news.id, title: 'Version 1', version: 1 });

    news.title = 'Current Title';
    await news.save();

    const res = await request(app)
      .patch(`/api/news/${news.id}/rollback/${version.id}`)
      .set('Authorization', `Bearer ${editorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.news.title).toEqual('Version 1');
  });

  it('should only show published articles to the public', async () => {
    await News.create({ title: 'Published Article', authorId: reporter.id, status: 'published', publishedAt: new Date() });
    await News.create({ title: 'Draft Article', authorId: reporter.id, status: 'draft' });

    const res = await request(app).get('/api/news');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(1);
  });
});
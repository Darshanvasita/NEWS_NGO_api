const request = require('supertest');
const { app } = require('../src/server');

describe('Swagger API Documentation', () => {
  let server;

  beforeAll(() => {
    server = app.listen(4019);
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger UI', async () => {
      const res = await request(app)
        .get('/api-docs/')
        .expect(200);
      
      expect(res.text).toContain('swagger-ui');
    });
  });

  describe('GET /api-docs/', () => {
    it('should redirect to Swagger UI with trailing slash', async () => {
      await request(app)
        .get('/api-docs')
        .expect(301);
    });
  });
});
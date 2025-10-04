// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

const request = require('supertest');
const { app } = require('../src/server');
const { Subscription, sequelize } = require('../src/models');

describe('Subscription API', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4012); // Use a unique port for this test suite
  });

  afterEach(async () => {
    // Clear the subscriptions table after each test
    await Subscription.destroy({ where: {} });
  });

  afterAll(async () => {
    // Close the database connection and the server
    await sequelize.close();
    server.close();
  });

  describe('POST /api/subscribe', () => {
    it('should subscribe a user with a valid email', async () => {
      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'test@example.com' });
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Subscription successful.');
      expect(res.body.subscription.email).toBe('test@example.com');
    });

    it('should not subscribe a user with an invalid email', async () => {
      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'not-an-email' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid email format.');
    });

    it('should not subscribe a user with an existing email', async () => {
      // First, create a subscription
      await Subscription.create({ email: 'test@example.com' });

      // Then, try to subscribe with the same email
      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'test@example.com' });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('This email is already subscribed.');
    });

    it('should not subscribe a user without an email', async () => {
        const res = await request(app)
            .post('/api/subscribe')
            .send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Email is required.');
    });
  });
});
// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

const request = require('supertest');
const { app } = require('../src/server');
const { Subscriber, sequelize } = require('../src/models');

describe('Subscription API', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4015);
  });

  afterEach(async () => {
    await Subscriber.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('POST /api/subscribe', () => {
    it('should initiate subscription and send OTP', async () => {
      const subscriberData = {
        email: 'test@example.com',
      };

      const res = await request(app)
        .post('/api/subscribe')
        .send(subscriberData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('OTP sent to your email. Please verify to complete your subscription.');

      const subscriber = await Subscriber.findOne({ where: { email: 'test@example.com' } });
      expect(subscriber).not.toBeNull();
      expect(subscriber.otp).not.toBeNull();
      expect(subscriber.expires_at).not.toBeNull();
      expect(subscriber.confirmed).toBe(false);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/subscribe')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email is required.');
    });

    it('should return 409 if email is already subscribed', async () => {
      // Create a confirmed subscriber
      await Subscriber.create({
        email: 'test@example.com',
        confirmed: true
      });

      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('This email is already subscribed.');
    });
  });

  describe('POST /api/subscribe/verify-otp', () => {
    it('should verify OTP and confirm subscription', async () => {
      // Create a subscriber with OTP
      const subscriber = await Subscriber.create({
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        confirmed: false
      });

      const res = await request(app)
        .post('/api/subscribe/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '123456'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Subscription successful. Welcome aboard!');

      // Check that subscriber is now confirmed
      const updatedSubscriber = await Subscriber.findByPk(subscriber.id);
      expect(updatedSubscriber.confirmed).toBe(true);
      expect(updatedSubscriber.otp).toBeNull();
      expect(updatedSubscriber.expires_at).toBeNull();
    });

    it('should return 400 if email or OTP is missing', async () => {
      const res = await request(app)
        .post('/api/subscribe/verify-otp')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email and OTP are required.');
    });

    it('should return 400 for invalid OTP', async () => {
      // Create a subscriber with OTP
      await Subscriber.create({
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        confirmed: false
      });

      const res = await request(app)
        .post('/api/subscribe/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '654321'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid OTP.');
    });

    it('should return 400 for expired OTP', async () => {
      // Create a subscriber with expired OTP
      await Subscriber.create({
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 minutes ago
        confirmed: false
      });

      const res = await request(app)
        .post('/api/subscribe/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '123456'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('OTP has expired.');
    });
  });

  describe('GET /api/subscribe/unsubscribe', () => {
    it('should unsubscribe a confirmed subscriber', async () => {
      // Create a confirmed subscriber
      await Subscriber.create({
        email: 'test@example.com',
        confirmed: true
      });

      const res = await request(app)
        .get('/api/subscribe/unsubscribe')
        .query({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('You have been successfully unsubscribed.');

      // Check that subscriber is deleted
      const subscriber = await Subscriber.findOne({ where: { email: 'test@example.com' } });
      expect(subscriber).toBeNull();
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .get('/api/subscribe/unsubscribe')
        .query({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email is required.');
    });

    it('should return 404 if email is not found', async () => {
      const res = await request(app)
        .get('/api/subscribe/unsubscribe')
        .query({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Email not found in our subscriber list.');
    });
  });
});
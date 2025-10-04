// Mock the sequelize config to use SQLite for tests.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Mock the mail service
jest.mock('../src/services/mail.service.js', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(),
  sendWelcomeEmail: jest.fn().mockResolvedValue(),
}));

const request = require('supertest');
const { app } = require('../src/server');
const { Subscriber, SubscriptionTemp, sequelize } = require('../src/models');
const { sendOtpEmail, sendWelcomeEmail } = require('../src/services/mail.service');

describe('Subscription Flow API', () => {
  let server;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(4013); // Use a unique port for this test suite
  });

  afterEach(async () => {
    // Clear tables after each test
    await Subscriber.destroy({ where: {} });
    await SubscriptionTemp.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close the database connection and the server
    await sequelize.close();
    server.close();
  });

  describe('POST /api/subscribe', () => {
    it('should send an OTP to a new email', async () => {
      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'new@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('OTP sent to your email. Please verify to complete your subscription.');

      const tempSub = await SubscriptionTemp.findOne({ where: { email: 'new@example.com' } });
      expect(tempSub).not.toBeNull();
      expect(tempSub.otp).toBeDefined();

      expect(sendOtpEmail).toHaveBeenCalledWith('new@example.com', tempSub.otp);
    });

    it('should return 409 if email is already subscribed', async () => {
      await Subscriber.create({ email: 'test@example.com' });

      const res = await request(app)
        .post('/api/subscribe')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('This email is already subscribed.');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/subscribe')
        .send({});
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/subscribe/verify-otp', () => {
    it('should subscribe a user with a valid OTP', async () => {
      await request(app).post('/api/subscribe').send({ email: 'verify@example.com' });
      const tempSub = await SubscriptionTemp.findOne({ where: { email: 'verify@example.com' } });

      const res = await request(app)
        .post('/api/subscribe/verify-otp')
        .send({ email: 'verify@example.com', otp: tempSub.otp });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Subscription successful. Welcome aboard!');

      const subscriber = await Subscriber.findOne({ where: { email: 'verify@example.com' } });
      expect(subscriber).not.toBeNull();

      const deletedTempSub = await SubscriptionTemp.findOne({ where: { email: 'verify@example.com' } });
      expect(deletedTempSub).toBeNull();

      expect(sendWelcomeEmail).toHaveBeenCalledWith('verify@example.com');
    });

    it('should return 400 for an invalid OTP', async () => {
        await request(app).post('/api/subscribe').send({ email: 'invalid@example.com' });

        const res = await request(app)
            .post('/api/subscribe/verify-otp')
            .send({ email: 'invalid@example.com', otp: '000000' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid OTP.');
    });

    it('should return 400 for an expired OTP', async () => {
        const email = 'expired@example.com';
        const otp = '123456';
        await SubscriptionTemp.create({
            email,
            otp,
            expires_at: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
        });

        const res = await request(app)
            .post('/api/subscribe/verify-otp')
            .send({ email, otp });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('OTP has expired.');
    });
  });

  describe('GET /api/subscribe/unsubscribe', () => {
    it('should unsubscribe a user with a valid email', async () => {
      const email = 'unsubscribe@example.com';
      await Subscriber.create({ email });

      const res = await request(app).get(`/api/subscribe/unsubscribe?email=${email}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('You have been successfully unsubscribed.');

      const subscriber = await Subscriber.findOne({ where: { email } });
      expect(subscriber).toBeNull();
    });

    it('should return 404 for an email that is not subscribed', async () => {
        const res = await request(app).get('/api/subscribe/unsubscribe?email=notfound@example.com');
        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Email not found in our subscriber list.');
    });
  });
});
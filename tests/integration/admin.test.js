const request = require('supertest');
const { app } = require('../../src/server');
const { User, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../../src/utils/email');

// Mock the email service
jest.mock('../../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(),
}));

let server;
let adminToken, reporterToken;
let adminUser;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  server = app.listen(process.env.PORT || 4011);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
  await sequelize.close();
});

beforeEach(async () => {
  // Clear mocks and data before each test
  jest.clearAllMocks();
  await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });

  // Create users and tokens
  adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin', status: 'active' });
  const reporterUser = await User.create({ name: 'Reporter User', email: 'reporter@example.com', password: 'password123', role: 'reporter', status: 'active' });

  adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET);
  reporterToken = jwt.sign({ id: reporterUser.id, role: reporterUser.role }, process.env.JWT_SECRET);
});

describe('Admin Invite API', () => {
  const invitePayload = {
    email: 'new.editor@example.com',
    role: 'editor',
  };

  it('should allow an admin to invite a new user as an editor', async () => {
    const res = await request(app)
      .post('/api/admin/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invitePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(`Invitation sent to ${invitePayload.email}.`);

    // Verify a user was created with 'pending' status
    const newUser = await User.findOne({ where: { email: invitePayload.email } });
    expect(newUser).not.toBeNull();
    expect(newUser.role).toBe('editor');
    expect(newUser.status).toBe('pending');

    // Verify email was sent
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should allow an admin to invite a new user as a reporter', async () => {
    const reporterPayload = { email: 'new.reporter@example.com', role: 'reporter' };
    const res = await request(app)
      .post('/api/admin/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(reporterPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(`Invitation sent to ${reporterPayload.email}.`);

    const newUser = await User.findOne({ where: { email: reporterPayload.email } });
    expect(newUser).not.toBeNull();
    expect(newUser.role).toBe('reporter');
    expect(newUser.status).toBe('pending');

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should return 400 for an invalid role', async () => {
    const res = await request(app)
      .post('/api/admin/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'test@example.com', role: 'viewer' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Invalid role');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should return 409 if the user already exists', async () => {
    // This user already exists from the beforeEach hook
    const res = await request(app)
      .post('/api/admin/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@example.com', role: 'editor' });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('User with this email already exists.');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/admin/invite')
      .send(invitePayload);

    expect(res.statusCode).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should return 403 for requests made by non-admin users', async () => {
    const res = await request(app)
      .post('/api/admin/invite')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(invitePayload);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Access denied');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
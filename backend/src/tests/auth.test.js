const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/user.model');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/payment_dashboard_test');
});

afterAll(async () => {
  await User.deleteMany({ email: /test.*@test\.com/ });
  await mongoose.connection.close();
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await User.create({ name: 'Test Admin', email: 'testadmin@test.com', password: 'Test@1234', role: 'admin' });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'Test@1234' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com' });
    expect(res.status).toBe(400);
  });
});

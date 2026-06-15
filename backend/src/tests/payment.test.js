const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/user.model');
const Payment = require('../../src/models/payment.model');
const jwt = require('jsonwebtoken');

let adminToken;
let adminUser;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/payment_dashboard_test');
  adminUser = await User.create({ name: 'Pay Tester', email: 'paytester@test.com', password: 'Test@1234', role: 'admin' });
  adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'test-secret');
});

afterAll(async () => {
  await User.deleteMany({ email: 'paytester@test.com' });
  await Payment.deleteMany({ customerEmail: 'testcustomer@test.com' });
  await mongoose.connection.close();
});

describe('GET /api/payments', () => {
  it('should require authentication', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(401);
  });

  it('should return payments list for authenticated user', async () => {
    const res = await request(app).get('/api/payments').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('payments');
    expect(res.body).toHaveProperty('pagination');
  });

  it('should filter by status', async () => {
    const res = await request(app).get('/api/payments?status=succeeded').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.payments.forEach(p => expect(p.status).toBe('succeeded'));
  });
});

const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — Stripe features will not work');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'PaymentGatewayDashboard',
    version: '1.0.0',
  },
});

module.exports = stripe;

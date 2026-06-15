const stripe = require('../services/stripe.service');
const Payment = require('../models/payment.model');
const logger = require('../utils/logger');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.processing':
        await handlePaymentProcessing(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook processing error for ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handlePaymentSucceeded(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (!payment) return logger.warn(`Payment not found for PI: ${paymentIntent.id}`);

  const charge = paymentIntent.latest_charge;
  const paymentMethod = paymentIntent.payment_method_types?.[0];

  payment.status = 'succeeded';
  payment.paidAt = new Date();
  payment.stripeResponse = paymentIntent;
  payment.paymentMethodType = paymentMethod || 'card';

  // Try to extract card details from charges
  if (paymentIntent.charges?.data?.[0]?.payment_method_details?.card) {
    const card = paymentIntent.charges.data[0].payment_method_details.card;
    payment.last4 = card.last4;
    payment.cardBrand = card.brand;
  }

  payment.timeline.push({
    event: 'payment_succeeded',
    description: 'Payment completed successfully',
    metadata: { stripeEventId: paymentIntent.id },
  });

  await payment.save();
  logger.info(`Payment succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (!payment) return;

  const lastError = paymentIntent.last_payment_error;
  payment.status = 'failed';
  payment.failureCode = lastError?.code;
  payment.failureMessage = lastError?.message;
  payment.stripeResponse = paymentIntent;
  payment.timeline.push({
    event: 'payment_failed',
    description: lastError?.message || 'Payment failed',
    metadata: { code: lastError?.code },
  });

  await payment.save();
  logger.info(`Payment failed: ${paymentIntent.id}`);
}

async function handlePaymentProcessing(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (!payment) return;

  payment.status = 'processing';
  payment.timeline.push({ event: 'payment_processing', description: 'Payment is being processed' });
  await payment.save();
}

async function handlePaymentCanceled(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (!payment) return;

  payment.status = 'canceled';
  payment.timeline.push({ event: 'payment_canceled', description: 'Payment was canceled' });
  await payment.save();
}

async function handleChargeRefunded(charge) {
  const payment = await Payment.findOne({ paymentIntentId: charge.payment_intent });
  if (!payment) return;

  const refunds = charge.refunds?.data || [];
  for (const refund of refunds) {
    const exists = payment.refunds.some(r => r.stripeRefundId === refund.id);
    if (!exists) {
      payment.refunds.push({
        refundId: `ref_webhook_${refund.id}`,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        stripeRefundId: refund.id,
      });
    } else {
      const existing = payment.refunds.find(r => r.stripeRefundId === refund.id);
      if (existing) existing.status = refund.status;
    }
  }

  const totalRefunded = payment.refunds.filter(r => r.status === 'succeeded').reduce((s, r) => s + r.amount, 0);
  payment.status = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';
  payment.timeline.push({ event: 'charge_refunded', description: `Charge refunded via webhook` });

  await payment.save();
  logger.info(`Charge refunded for PI: ${charge.payment_intent}`);
}

async function handleDisputeCreated(dispute) {
  const payment = await Payment.findOne({ paymentIntentId: dispute.payment_intent });
  if (!payment) return;

  payment.timeline.push({
    event: 'dispute_created',
    description: `Dispute created: ${dispute.reason}`,
    metadata: { disputeId: dispute.id, amount: dispute.amount / 100 },
  });
  await payment.save();
}

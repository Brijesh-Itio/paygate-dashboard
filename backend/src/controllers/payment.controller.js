const stripe = require('../services/stripe.service');
const Payment = require('../models/payment.model');
const logger = require('../utils/logger');
const { createObjectCsvStringifier } = require('csv-writer');

// POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', customerName, customerEmail, description, metadata } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: currency.toLowerCase(),
      metadata: { customerName, customerEmail, ...metadata },
      description,
      automatic_payment_methods: { enabled: true },
    });

    // Create payment record in DB
    const payment = await Payment.create({
      paymentIntentId: paymentIntent.id,
      customerName,
      customerEmail,
      amount: paymentIntent.amount,
      currency: currency.toUpperCase(),
      status: 'pending',
      description,
      metadata,
      createdBy: req.user._id,
      timeline: [{ event: 'created', description: 'Payment intent created' }],
    });

    logger.info(`Payment intent created: ${paymentIntent.id}`);

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      payment,
    });
  } catch (err) {
    logger.error('Create payment intent error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment intent' });
  }
};

// GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      status, search,
      startDate, endDate,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'all') query.status = status;

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { paymentIntentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean({ virtuals: true }),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Get payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// GET /api/payments/:id
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('createdBy', 'name email');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Optionally fetch latest from Stripe
    try {
      const stripePayment = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
      payment.stripeResponse = stripePayment;
    } catch (e) {
      logger.warn(`Could not fetch Stripe data for ${payment.paymentIntentId}`);
    }

    res.json({ payment });
  } catch (err) {
    logger.error('Get payment by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// POST /api/payments/refund
exports.createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
      return res.status(400).json({ error: 'Payment cannot be refunded in its current state' });
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    const refundableAmount = payment.amount - payment.totalRefunded;

    if (refundAmount && refundAmount > refundableAmount) {
      return res.status(400).json({ error: `Cannot refund more than ${refundableAmount / 100}` });
    }

    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      ...(refundAmount && { amount: refundAmount }),
      reason: reason || 'requested_by_customer',
    });

    const refundRecord = {
      refundId: `ref_${Date.now()}`,
      amount: stripeRefund.amount,
      reason,
      status: stripeRefund.status,
      stripeRefundId: stripeRefund.id,
    };

    payment.refunds.push(refundRecord);
    payment.timeline.push({ event: 'refund_initiated', description: `Refund of ${stripeRefund.amount / 100} initiated` });

    const totalRefunded = payment.refunds.filter(r => r.status === 'succeeded').reduce((s, r) => s + r.amount, 0) + stripeRefund.amount;
    payment.status = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';

    await payment.save();
    logger.info(`Refund created for payment ${payment.paymentIntentId}: ${stripeRefund.id}`);

    res.json({ refund: refundRecord, payment });
  } catch (err) {
    logger.error('Create refund error:', err);
    res.status(500).json({ error: err.message || 'Failed to create refund' });
  }
};

// GET /api/payments/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'paymentIntentId', title: 'Transaction ID' },
        { id: 'customerName', title: 'Customer Name' },
        { id: 'customerEmail', title: 'Customer Email' },
        { id: 'amountStr', title: 'Amount' },
        { id: 'currency', title: 'Currency' },
        { id: 'status', title: 'Status' },
        { id: 'paymentMethodType', title: 'Payment Method' },
        { id: 'createdAt', title: 'Date' },
      ]
    });

    const records = payments.map(p => ({
      ...p,
      amountStr: (p.amount / 100).toFixed(2),
      createdAt: new Date(p.createdAt).toISOString(),
    }));

    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    logger.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export' });
  }
};


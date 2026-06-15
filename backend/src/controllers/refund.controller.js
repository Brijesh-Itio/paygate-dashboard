const Payment = require('../models/payment.model');
const stripe = require('../services/stripe.service');
const logger = require('../utils/logger');

exports.getAllRefunds = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchQuery = { status: { $in: ['refunded', 'partially_refunded'] } };
    if (startDate || endDate) {
      matchQuery.updatedAt = {};
      if (startDate) matchQuery.updatedAt.$gte = new Date(startDate);
      if (endDate) matchQuery.updatedAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const [payments, total] = await Promise.all([
      Payment.find(matchQuery).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)).lean({ virtuals: true }),
      Payment.countDocuments(matchQuery),
    ]);

    const refunds = payments.flatMap(p =>
      (p.refunds || []).map(r => ({
        ...r,
        payment: {
          id: p._id,
          customerName: p.customerName,
          customerEmail: p.customerEmail,
          paymentIntentId: p.paymentIntentId,
          originalAmount: p.amount,
          currency: p.currency,
        },
      }))
    );

    res.json({
      refunds,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Get refunds error:', err);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
};

exports.getRefundById = async (req, res) => {
  try {
    const payment = await Payment.findOne({ 'refunds.stripeRefundId': req.params.refundId });
    if (!payment) return res.status(404).json({ error: 'Refund not found' });
    const refund = payment.refunds.find(r => r.stripeRefundId === req.params.refundId);
    res.json({ refund, payment: { id: payment._id, customerName: payment.customerName, paymentIntentId: payment.paymentIntentId } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch refund' });
  }
};

exports.getRefundStats = async (req, res) => {
  try {
    const [stats] = await Payment.aggregate([
      { $match: { status: { $in: ['refunded', 'partially_refunded'] } } },
      { $unwind: '$refunds' },
      { $match: { 'refunds.status': 'succeeded' } },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: 1 },
          totalRefundedAmount: { $sum: '$refunds.amount' },
          avgRefundAmount: { $avg: '$refunds.amount' },
        },
      },
    ]);

    res.json({
      stats: stats ? {
        ...stats,
        totalRefundedAmount: stats.totalRefundedAmount / 100,
        avgRefundAmount: stats.avgRefundAmount / 100,
      } : { totalRefunds: 0, totalRefundedAmount: 0, avgRefundAmount: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch refund stats' });
  }
};

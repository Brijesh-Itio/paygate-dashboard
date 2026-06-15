const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  event: { type: String, required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const refundSchema = new mongoose.Schema({
  refundId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'canceled'], default: 'pending' },
  stripeRefundId: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  paymentIntentId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  amount: { type: Number, required: true }, // in cents
  currency: { type: String, required: true, default: 'usd', uppercase: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true,
  },
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  stripeResponse: { type: mongoose.Schema.Types.Mixed },
  paymentMethodType: { type: String, default: 'card' },
  last4: { type: String },
  cardBrand: { type: String },
  refunds: [refundSchema],
  timeline: [timelineEventSchema],
  paidAt: { type: Date },
  failureCode: { type: String },
  failureMessage: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual: amount in dollars
paymentSchema.virtual('amountInDollars').get(function () {
  return this.amount / 100;
});

// Virtual: total refunded amount
paymentSchema.virtual('totalRefunded').get(function () {
  return this.refunds
    .filter(r => r.status === 'succeeded')
    .reduce((sum, r) => sum + r.amount, 0);
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

// Indexes for common queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ customerEmail: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

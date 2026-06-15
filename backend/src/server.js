  require('dotenv').config()

  console.log('Mongo URI:', process.env.MONGODB_URI);
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const mongoose = require('mongoose');
  const rateLimit = require('express-rate-limit');

  const authRoutes = require('./routes/auth.routes');
  const paymentRoutes = require('./routes/payment.routes');
  const dashboardRoutes = require('./routes/dashboard.routes');
  const webhookRoutes = require('./routes/webhook.routes');
  const refundRoutes = require('./routes/refund.routes');
  const reportRoutes = require('./routes/report.routes');
  const logger = require('./utils/logger');

  const app = express();

  // Webhook route needs raw body — must be registered BEFORE express.json()
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://paygate-frontend.onrender.com'
    ],
    credentials: true,
}));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/refunds', refundRoutes);
  app.use('/api/reports', reportRoutes);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // 404 handler
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  // Database connection & server start
  const PORT = process.env.PORT || 5000;

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_dashboard')
    .then(() => {
      logger.info(' MongoDB connected');
      app.listen(PORT, () => logger.info(` Server running on port ${PORT}`));
    })
    .catch(err => {
      logger.error('MongoDB connection failed:', err);
      process.exit(1);
    });

  module.exports = app;

const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/create-intent', paymentController.createPaymentIntent);
router.get('/export/csv', requireAdmin, paymentController.exportCSV);
router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);
router.post('/refund', requireAdmin, paymentController.createRefund);

module.exports = router;

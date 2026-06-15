const express = require('express');
const refundController = require('../controllers/refund.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', refundController.getAllRefunds);
router.get('/stats', requireAdmin, refundController.getRefundStats);
router.get('/:refundId', refundController.getRefundById);

module.exports = router;

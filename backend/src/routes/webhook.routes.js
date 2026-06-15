const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const router = express.Router();
// Raw body is applied in server.js before this router
router.post('/', webhookController.handleStripeWebhook);
module.exports = router;

const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(authenticate);
router.get('/stats', dashboardController.getStats);
router.get('/revenue-report', dashboardController.getRevenueReport);
router.get('/recent-transactions', dashboardController.getRecentTransactions);
module.exports = router;

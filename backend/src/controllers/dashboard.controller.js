const Payment = require('../models/payment.model');
const logger = require('../utils/logger');

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));

    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [stats] = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,  
          totalTransactions: { $sum: 1 },
          successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', 0] } },
          totalRefunded: { $sum: { $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, '$amount', 0] } },
          processingPayments: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
        }
      }
    ]);

    // Recent 7-day trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: stats ? {
        ...stats,
        totalRevenue: stats.totalRevenue / 100,
        totalRefunded: stats.totalRefunded / 100,
      } : {
        totalTransactions: 0, successfulPayments: 0, failedPayments: 0,
        pendingPayments: 0, totalRevenue: 0, totalRefunded: 0, processingPayments: 0,
      },
      dailyRevenue: dailyRevenue.map(d => ({
        date: d._id,
        revenue: d.revenue / 100,
        count: d.count,
      })),
    });
  } catch (err) {
    logger.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/dashboard/revenue-report
exports.getRevenueReport = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let groupFormat;
    switch (period) {
      case 'weekly': groupFormat = '%Y-W%V'; break;
      case 'monthly': groupFormat = '%Y-%m'; break;
      default: groupFormat = '%Y-%m-%d';
    }

    const report = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          period: '$_id',
          revenue: { $divide: ['$revenue', 100] },
          transactions: 1,
          avgAmount: { $divide: ['$avgAmount', 100] },
          _id: 0,
        }
      }
    ]);

    // Status breakdown
    const statusBreakdown = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $project: { status: '$_id', count: 1, total: { $divide: ['$total', 100] }, _id: 0 } }
    ]);

    res.json({ report, statusBreakdown, period, startDate: start, endDate: end });
  } catch (err) {
    logger.error('Revenue report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// GET /api/dashboard/recent-transactions
exports.getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('paymentIntentId customerName customerEmail amount currency status createdAt')
      .lean();

    res.json({ transactions });
  } catch (err) {
    logger.error('Recent transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
};

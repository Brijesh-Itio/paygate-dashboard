const express = require('express');
const Payment = require('../models/payment.model');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');
const router = express.Router();

router.use(authenticate, requireAdmin);

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [summary] = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', 0] } },
          successCount: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          refundedCount: { $sum: { $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, 1, 0] } },
          avgAmount: { $avg: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', null] } },
        }
      }
    ]);

    const topCustomers = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$customerEmail', name: { $first: '$customerName' }, totalSpent: { $sum: '$amount' }, transactions: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $project: { email: '$_id', name: 1, totalSpent: { $divide: ['$totalSpent', 100] }, transactions: 1, _id: 0 } }
    ]);

    res.json({
      summary: summary ? {
        ...summary,
        totalRevenue: summary.totalRevenue / 100,
        avgAmount: (summary.avgAmount || 0) / 100,
        successRate: summary.totalTransactions > 0 ? ((summary.successCount / summary.totalTransactions) * 100).toFixed(1) : 0,
      } : {},
      topCustomers,
      period: { start, end },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// GET /api/reports/export/pdf
router.get('/export/pdf', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [stats] = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', 0] } },
          avgAmount: { $avg: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', null] } },
        }
      }
    ]);

    const dailyRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const s = stats || { totalTransactions: 0, successful: 0, failed: 0, pending: 0, totalRevenue: 0, avgAmount: 0 };
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=paygate-report-${Date.now()}.pdf`);
    doc.pipe(res);

    // Header band
    doc.rect(0, 0, doc.page.width, 80).fill('#1e3a5f');
    doc.fill('#ffffff').fontSize(22).font('Helvetica-Bold').text('PayGate', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Payment Gateway Report', 50, 52);
    doc.text(`${start.toDateString()} — ${end.toDateString()}`, 300, 52, { align: 'right', width: 245 });

    doc.fill('#1e293b').moveDown(3);

    // Stats section
    doc.fill('#1e3a5f').fontSize(14).font('Helvetica-Bold').text('Summary Statistics', 50, 110);
    doc.moveTo(50, 128).lineTo(545, 128).stroke('#334155');

    const rows = [
      ['Total Transactions', s.totalTransactions.toString()],
      ['Successful Payments', `${s.successful} (${s.totalTransactions > 0 ? ((s.successful / s.totalTransactions) * 100).toFixed(1) : 0}%)`],
      ['Failed Payments', s.failed.toString()],
      ['Pending Payments', s.pending.toString()],
      ['Total Revenue', `$${(s.totalRevenue / 100).toFixed(2)}`],
      ['Average Transaction', `$${((s.avgAmount || 0) / 100).toFixed(2)}`],
    ];

    let y = 140;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#f8fafc');
      doc.fill('#374151').fontSize(10).font('Helvetica-Bold').text(label, 60, y);
      doc.fill('#111827').font('Helvetica').text(value, 350, y, { align: 'right', width: 185 });
      y += 24;
    });

    // Daily revenue table
    if (dailyRevenue.length > 0) {
      y += 20;
      doc.fill('#1e3a5f').fontSize(14).font('Helvetica-Bold').text('Daily Revenue Breakdown', 50, y);
      y += 20;
      doc.moveTo(50, y).lineTo(545, y).stroke('#334155');
      y += 12;

      doc.fill('#6b7280').fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 60, y);
      doc.text('Transactions', 200, y);
      doc.text('Revenue', 400, y, { align: 'right', width: 145 });
      y += 18;

      dailyRevenue.slice(0, 20).forEach((row, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        if (i % 2 === 0) doc.rect(50, y - 4, 495, 18).fill('#f9fafb');
        doc.fill('#374151').fontSize(9).font('Helvetica').text(row._id, 60, y);
        doc.text(row.count.toString(), 200, y);
        doc.text(`$${(row.revenue / 100).toFixed(2)}`, 400, y, { align: 'right', width: 145 });
        y += 18;
      });
    }

    // Footer
    doc.fill('#9ca3af').fontSize(8).font('Helvetica')
      .text(`Generated by PayGate on ${new Date().toISOString()}`, 50, doc.page.height - 40, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// GET /api/reports/export/csv
router.get('/export/csv', async (req, res) => {
  try {
    const { startDate, endDate, type = 'transactions' } = req.query;
    const query = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...(query.createdAt || {}), $lte: new Date(endDate) };

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'paymentIntentId', title: 'Transaction ID' },
        { id: 'customerName', title: 'Customer Name' },
        { id: 'customerEmail', title: 'Customer Email' },
        { id: 'amount', title: 'Amount (USD)' },
        { id: 'currency', title: 'Currency' },
        { id: 'status', title: 'Status' },
        { id: 'cardBrand', title: 'Card Brand' },
        { id: 'last4', title: 'Last 4' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'paidAt', title: 'Paid At' },
      ]
    });

    const records = payments.map(p => ({
      ...p,
      amount: (p.amount / 100).toFixed(2),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : '',
      cardBrand: p.cardBrand || '',
      last4: p.last4 || '',
    }));

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});

module.exports = router;

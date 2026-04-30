const express = require('express');
const Entry = require('../models/Entry');

const router = express.Router();

/**
 * Validate YYYY-MM-DD date format
 */
function isValidDateFormat(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * GET /api/entries
 * Fetch entries by date range
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const errors = [];

    if (!startDate) {
      errors.push('startDate query parameter is required');
    } else if (!isValidDateFormat(startDate)) {
      errors.push('startDate must be in YYYY-MM-DD format');
    }

    if (!endDate) {
      errors.push('endDate query parameter is required');
    } else if (!isValidDateFormat(endDate)) {
      errors.push('endDate must be in YYYY-MM-DD format');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors },
      });
    }

    const entries = await Entry.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return res.json({ success: true, entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: [] },
    });
  }
});


/**
 * POST /api/entries
 * Create a new entry
 * Body: { date: "YYYY-MM-DD", sugarConsumed: boolean }
 */
router.post('/', async (req, res) => {
  try {
    const { date, sugarConsumed } = req.body;
    const errors = [];

    if (!date) {
      errors.push('Date is required');
    } else if (!isValidDateFormat(date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    if (typeof sugarConsumed !== 'boolean') {
      errors.push('sugarConsumed must be a boolean');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors },
      });
    }

    const entry = await Entry.create({ date, sugarConsumed });
    return res.status(201).json({ success: true, entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An entry for this date already exists',
          details: ['Use PUT /api/entries/:date to update an existing entry'],
        },
      });
    }
    console.error('Error creating entry:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: [] },
    });
  }
});

/**
 * PUT /api/entries/:date
 * Update entry by date (upsert: create if doesn't exist)
 * Params: date (YYYY-MM-DD)
 * Body: { sugarConsumed: boolean }
 */
router.put('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { sugarConsumed } = req.body;
    const errors = [];

    if (!isValidDateFormat(date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    if (typeof sugarConsumed !== 'boolean') {
      errors.push('sugarConsumed must be a boolean');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors },
      });
    }

    const entry = await Entry.findOneAndUpdate(
      { date },
      { date, sugarConsumed },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating entry:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: [] },
    });
  }
});

module.exports = router;

const express = require('express');
const Image = require('../models/Image');

const router = express.Router();

/**
 * GET /api/images
 * Fetch all images
 */
router.get('/', async (req, res) => {
  try {
    const images = await Image.find({}).sort({ createdAt: -1 });

    return res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: [] },
    });
  }
});

module.exports = router;

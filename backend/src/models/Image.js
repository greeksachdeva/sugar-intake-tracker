const mongoose = require('mongoose');

/**
 * Validates that a string is a valid URL or base64 data URI.
 */
function isValidUrlOrBase64(value) {
  // Check for base64 data URI
  if (/^data:image\/[a-zA-Z+.-]+;base64,/.test(value)) {
    return true;
  }
  // Check for valid URL (http or https)
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      validate: {
        validator: isValidUrlOrBase64,
        message: 'url must be a valid URL or base64 data URI',
      },
    },
    alt: {
      type: String,
      required: [true, 'Alt text is required'],
      validate: {
        validator: function (value) {
          return typeof value === 'string' && value.trim().length > 0;
        },
        message: 'alt must be a non-empty string',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;

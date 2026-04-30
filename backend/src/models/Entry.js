const mongoose = require('mongoose');

// Entry schema for tracking daily sugar consumption
const entrySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      unique: true,
      validate: {
        validator: function (value) {
          // Validate ISO 8601 date format (YYYY-MM-DD)
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
        message: 'Date must be in YYYY-MM-DD format',
      },
    },
    sugarConsumed: {
      type: Boolean,
      required: [true, 'sugarConsumed is required'],
      validate: {
        validator: function (value) {
          return typeof value === 'boolean';
        },
        message: 'sugarConsumed must be a boolean',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Entry = mongoose.model('Entry', entrySchema);

module.exports = Entry;

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const entriesRouter = require('./routes/entries');
const healthRouter = require('./routes/health');
const imagesRouter = require('./routes/images');

const app = express();

// CORS middleware — whitelist frontend URL from environment variable
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// JSON body parser middleware
app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Routes
app.use('/api/entries', entriesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/health', healthRouter);

// Global error handler (must be registered after routes)
app.use(errorHandler);

// Start server only when this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;

  connectDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

module.exports = app;

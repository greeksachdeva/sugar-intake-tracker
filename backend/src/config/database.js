const mongoose = require('mongoose');

/**
 * Database connection configuration
 */
const MAX_RETRIES = 5;
const RETRY_INTERVAL = process.env.NODE_ENV === 'test' ? 10 : 5000; // 10ms for tests, 5s for production

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sugar-tracker';
  
  let retries = 0;

  const connect = async () => {
    try {
      await mongoose.connect(mongoUri, {
        // Mongoose 6+ no longer needs these options, but keeping for compatibility
        // useNewUrlParser and useUnifiedTopology are now default
      });

      console.log(`MongoDB connected successfully to ${mongoose.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });

    } catch (error) {
      console.error(`MongoDB connection failed (attempt ${retries + 1}/${MAX_RETRIES}):`, error.message);
      
      retries++;
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying connection in ${RETRY_INTERVAL / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        return connect();
      } else {
        console.error('Max retries reached. Could not connect to MongoDB.');
        throw new Error('Failed to connect to MongoDB after multiple attempts');
      }
    }
  };

  await connect();
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};

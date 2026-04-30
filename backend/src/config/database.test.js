const { connectDatabase, disconnectDatabase } = require('./database');
const mongoose = require('mongoose');

// Mock mongoose to avoid actual database connections in tests
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    close: jest.fn(),
    host: 'localhost'
  }
}));

describe('Database Connection Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('connectDatabase', () => {
    it('should connect to MongoDB successfully', async () => {
      mongoose.connect.mockResolvedValueOnce();

      await connectDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('MongoDB connected successfully')
      );
    });

    it('should use MONGODB_URI from environment', async () => {
      const testUri = 'mongodb://test:27017/testdb';
      process.env.MONGODB_URI = testUri;
      mongoose.connect.mockResolvedValueOnce();

      await connectDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith(
        testUri,
        expect.any(Object)
      );

      delete process.env.MONGODB_URI;
    });

    it('should register connection event handlers', async () => {
      mongoose.connect.mockResolvedValueOnce();

      await connectDatabase();

      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });

    it('should retry connection on failure', async () => {
      jest.useFakeTimers();
      
      mongoose.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce();

      const connectPromise = connectDatabase();
      
      // Fast-forward through retry interval
      await jest.advanceTimersByTimeAsync(5000);
      
      await connectPromise;

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('MongoDB connection failed'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('should throw error after max retries', async () => {
      mongoose.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(connectDatabase()).rejects.toThrow('Failed to connect to MongoDB after multiple attempts');
      
      expect(mongoose.connect).toHaveBeenCalledTimes(5);
      expect(console.error).toHaveBeenCalledWith(
        'Max retries reached. Could not connect to MongoDB.'
      );
    });
  });

  describe('disconnectDatabase', () => {
    it('should close MongoDB connection successfully', async () => {
      mongoose.connection.close.mockResolvedValueOnce();

      await disconnectDatabase();

      expect(mongoose.connection.close).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('MongoDB connection closed');
    });

    it('should handle disconnection errors', async () => {
      const error = new Error('Disconnection failed');
      mongoose.connection.close.mockRejectedValueOnce(error);

      await expect(disconnectDatabase()).rejects.toThrow('Disconnection failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error closing MongoDB connection:',
        error
      );
    });
  });
});

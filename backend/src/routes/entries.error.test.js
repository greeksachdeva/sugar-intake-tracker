const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const Entry = require('../models/Entry');

let mongoServer;

describe('Entries API - Error Handling', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Entry.deleteMany({});
    jest.restoreAllMocks();
  });

  // ─── Database Error Scenarios ───────────────────────────────────────

  describe('Database errors (500 responses)', () => {
    test('GET /api/entries returns 500 when Entry.find throws', async () => {
      jest.spyOn(Entry, 'find').mockImplementation(() => {
        throw new Error('DB connection lost');
      });

      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '2025-01-01', endDate: '2025-01-31' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: { message: 'Internal server error', details: [] },
      });
    });

    test('POST /api/entries returns 500 when Entry.create throws', async () => {
      jest.spyOn(Entry, 'create').mockRejectedValue(new Error('Write failed'));

      const res = await request(app)
        .post('/api/entries')
        .send({ date: '2025-06-01', sugarConsumed: true });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: { message: 'Internal server error', details: [] },
      });
    });

    test('PUT /api/entries/:date returns 500 when findOneAndUpdate throws', async () => {
      jest
        .spyOn(Entry, 'findOneAndUpdate')
        .mockRejectedValue(new Error('Update failed'));

      const res = await request(app)
        .put('/api/entries/2025-06-01')
        .send({ sugarConsumed: false });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: { message: 'Internal server error', details: [] },
      });
    });
  });

  // ─── Invalid Request Data Edge Cases ────────────────────────────────

  describe('Invalid request data edge cases', () => {
    test('POST with empty body returns 400', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('Date is required');
      expect(res.body.error.details).toContain('sugarConsumed must be a boolean');
    });

    test('POST with null values returns 400', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({ date: null, sugarConsumed: null });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(1);
    });

    test('POST with extra unexpected fields still creates entry', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          date: '2025-07-01',
          sugarConsumed: false,
          extraField: 'should be ignored',
          anotherExtra: 123,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.date).toBe('2025-07-01');
      expect(res.body.entry.sugarConsumed).toBe(false);
      expect(res.body.entry.extraField).toBeUndefined();
    });

    test('PUT with missing sugarConsumed in body returns 400', async () => {
      const res = await request(app)
        .put('/api/entries/2025-07-01')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('sugarConsumed must be a boolean');
    });

    test('GET with empty string query params returns 400', async () => {
      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '', endDate: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Backend / Database Unavailable ─────────────────────────────────

  describe('Database unavailable scenarios', () => {
    test('GET returns 500 when find rejects with connection error', async () => {
      jest.spyOn(Entry, 'find').mockImplementation(() => ({
        sort: jest.fn().mockRejectedValue(new Error('MongoNetworkError')),
      }));

      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '2025-01-01', endDate: '2025-01-31' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');
    });

    test('POST returns 500 when create rejects with connection error', async () => {
      jest
        .spyOn(Entry, 'create')
        .mockRejectedValue(new Error('MongoNetworkError: connection refused'));

      const res = await request(app)
        .post('/api/entries')
        .send({ date: '2025-08-01', sugarConsumed: true });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');
    });

    test('PUT returns 500 when findOneAndUpdate rejects with connection error', async () => {
      jest
        .spyOn(Entry, 'findOneAndUpdate')
        .mockRejectedValue(new Error('MongoNetworkError: connection refused'));

      const res = await request(app)
        .put('/api/entries/2025-08-01')
        .send({ sugarConsumed: false });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');
    });
  });
});

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const Entry = require('../models/Entry');

let mongoServer;

describe('Entries API', () => {
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
  });

  describe('GET /api/entries', () => {
    test('should return entries within date range', async () => {
      await Entry.create([
        { date: '2025-01-10', sugarConsumed: true },
        { date: '2025-01-15', sugarConsumed: false },
        { date: '2025-01-20', sugarConsumed: true },
        { date: '2025-02-01', sugarConsumed: false },
      ]);

      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '2025-01-01', endDate: '2025-01-31' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entries).toHaveLength(3);
      expect(res.body.entries[0].date).toBe('2025-01-10');
      expect(res.body.entries[2].date).toBe('2025-01-20');
    });

    test('should return empty array when no entries in range', async () => {
      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '2025-03-01', endDate: '2025-03-31' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entries).toHaveLength(0);
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .get('/api/entries')
        .query({ endDate: '2025-01-31' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('startDate query parameter is required');
    });

    test('should return 400 when endDate is missing', async () => {
      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '2025-01-01' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('endDate query parameter is required');
    });

    test('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .get('/api/entries')
        .query({ startDate: '01/01/2025', endDate: '2025-01-31' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('startDate must be in YYYY-MM-DD format');
    });
  });

  describe('POST /api/entries', () => {
    test('should create a new entry', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({ date: '2025-01-15', sugarConsumed: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.date).toBe('2025-01-15');
      expect(res.body.entry.sugarConsumed).toBe(true);
      expect(res.body.entry._id).toBeDefined();
    });

    test('should return 400 when date is missing', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({ sugarConsumed: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('Date is required');
    });

    test('should return 400 when sugarConsumed is not boolean', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({ date: '2025-01-15', sugarConsumed: 'yes' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('sugarConsumed must be a boolean');
    });

    test('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({ date: '01-15-2025', sugarConsumed: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('Date must be in YYYY-MM-DD format');
    });

    test('should return 409 for duplicate date', async () => {
      await Entry.create({ date: '2025-01-15', sugarConsumed: true });

      const res = await request(app)
        .post('/api/entries')
        .send({ date: '2025-01-15', sugarConsumed: false });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('An entry for this date already exists');
    });
  });

  describe('PUT /api/entries/:date', () => {
    test('should update an existing entry', async () => {
      await Entry.create({ date: '2025-01-15', sugarConsumed: true });

      const res = await request(app)
        .put('/api/entries/2025-01-15')
        .send({ sugarConsumed: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.date).toBe('2025-01-15');
      expect(res.body.entry.sugarConsumed).toBe(false);
    });

    test('should create entry via upsert when it does not exist', async () => {
      const res = await request(app)
        .put('/api/entries/2025-01-20')
        .send({ sugarConsumed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.date).toBe('2025-01-20');
      expect(res.body.entry.sugarConsumed).toBe(true);

      const entry = await Entry.findOne({ date: '2025-01-20' });
      expect(entry).not.toBeNull();
    });

    test('should return 400 for invalid date param', async () => {
      const res = await request(app)
        .put('/api/entries/not-a-date')
        .send({ sugarConsumed: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('Date must be in YYYY-MM-DD format');
    });

    test('should return 400 when sugarConsumed is not boolean', async () => {
      const res = await request(app)
        .put('/api/entries/2025-01-15')
        .send({ sugarConsumed: 'no' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('sugarConsumed must be a boolean');
    });
  });
});

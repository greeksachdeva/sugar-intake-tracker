// Feature: sugar-intake-tracker, Property 11: API Returns Valid JSON
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const fc = require('fast-check');
const app = require('../server');
const Entry = require('../models/Entry');

let mongoServer;

/**
 * Arbitrary: generates a valid YYYY-MM-DD date string within a reasonable range.
 * Uses integer-based generation to avoid timezone issues with fc.date().
 */
const validDateArb = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) => {
      const daysInMonth = new Date(year, month, 0).getDate();
      return fc.integer({ min: 1, max: daysInMonth }).map((day) => {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      });
    })
  );

describe('Property 11: API Returns Valid JSON', () => {
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

  // **Validates: Requirements 8.1**
  test('GET /api/entries always returns valid JSON with success:true and entries array for valid date ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        validDateArb,
        async (dateA, dateB) => {
          // Ensure startDate <= endDate
          const startDate = dateA <= dateB ? dateA : dateB;
          const endDate = dateA <= dateB ? dateB : dateA;

          const res = await request(app)
            .get('/api/entries')
            .query({ startDate, endDate });

          // Response must be valid JSON (supertest parses it; if invalid, res.body would be empty/undefined)
          expect(res.status).toBe(200);
          expect(res.headers['content-type']).toMatch(/json/);
          expect(res.body).toBeDefined();
          expect(typeof res.body).toBe('object');

          // Must have success: true
          expect(res.body.success).toBe(true);

          // Must have entries as an array
          expect(Array.isArray(res.body.entries)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 8.1**
  test('POST /api/entries with valid random data returns valid JSON with success:true and entry object', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        fc.boolean(),
        async (date, sugarConsumed) => {
          // Clean up any existing entry for this date to avoid 409 conflicts
          await Entry.deleteMany({ date });

          const res = await request(app)
            .post('/api/entries')
            .send({ date, sugarConsumed });

          // Response must be valid JSON
          expect(res.status).toBe(201);
          expect(res.headers['content-type']).toMatch(/json/);
          expect(res.body).toBeDefined();
          expect(typeof res.body).toBe('object');

          // Must have success: true
          expect(res.body.success).toBe(true);

          // Must have entry as an object with the correct fields
          expect(res.body.entry).toBeDefined();
          expect(typeof res.body.entry).toBe('object');
          expect(res.body.entry.date).toBe(date);
          expect(res.body.entry.sugarConsumed).toBe(sugarConsumed);
          expect(res.body.entry._id).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: sugar-intake-tracker, Property 1: Entry Creation and Storage
describe('Property 1: Entry Creation and Storage', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Disconnect any existing connection before connecting to new instance
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Entry.deleteMany({});
  });

  // **Validates: Requirements 1.2, 4.1**
  test('created entry is stored with correct date and sugarConsumed values', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        fc.boolean(),
        async (date, sugarConsumed) => {
          // Clean up to avoid duplicate key errors
          await Entry.deleteMany({ date });

          const res = await request(app)
            .post('/api/entries')
            .send({ date, sugarConsumed });

          expect(res.status).toBe(201);

          // Verify the entry is stored in the database with correct values
          const storedEntry = await Entry.findOne({ date });
          expect(storedEntry).not.toBeNull();
          expect(storedEntry.date).toBe(date);
          expect(storedEntry.sugarConsumed).toBe(sugarConsumed);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: sugar-intake-tracker, Property 2: Entry Update Overwrites Previous Value
describe('Property 2: Entry Update Overwrites Previous Value', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Entry.deleteMany({});
  });

  // **Validates: Requirements 1.3**
  test('updating an entry overwrites the previous value and maintains one entry per date', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        fc.boolean(),
        async (date, initialStatus) => {
          // Clean up to start fresh for this date
          await Entry.deleteMany({ date });

          // Create initial entry
          const createRes = await request(app)
            .post('/api/entries')
            .send({ date, sugarConsumed: initialStatus });
          expect(createRes.status).toBe(201);

          // Update with the opposite status
          const newStatus = !initialStatus;
          const updateRes = await request(app)
            .put(`/api/entries/${date}`)
            .send({ sugarConsumed: newStatus });
          expect(updateRes.status).toBe(200);

          // Verify only one entry exists for this date
          const entries = await Entry.find({ date });
          expect(entries).toHaveLength(1);

          // Verify the entry has the updated value
          expect(entries[0].sugarConsumed).toBe(newStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: sugar-intake-tracker, Property 13: Successful Operations Return Confirmation
describe('Property 13: Successful Operations Return Confirmation', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Entry.deleteMany({});
  });

  // **Validates: Requirements 8.4**
  test('successful create operations return success response with the created entry', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        fc.boolean(),
        async (date, sugarConsumed) => {
          await Entry.deleteMany({ date });

          const res = await request(app)
            .post('/api/entries')
            .send({ date, sugarConsumed });

          expect(res.status).toBe(201);
          expect(res.body.success).toBe(true);
          expect(res.body.entry).toBeDefined();
          expect(res.body.entry.date).toBe(date);
          expect(res.body.entry.sugarConsumed).toBe(sugarConsumed);
          expect(res.body.entry._id).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 8.4**
  test('successful update operations return success response with the updated entry', async () => {
    await fc.assert(
      fc.asyncProperty(
        validDateArb,
        fc.boolean(),
        async (date, sugarConsumed) => {
          await Entry.deleteMany({ date });

          const res = await request(app)
            .put(`/api/entries/${date}`)
            .send({ sugarConsumed });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.entry).toBeDefined();
          expect(res.body.entry.date).toBe(date);
          expect(res.body.entry.sugarConsumed).toBe(sugarConsumed);
          expect(res.body.entry._id).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

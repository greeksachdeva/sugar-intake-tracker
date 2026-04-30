const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fc = require('fast-check');
const Entry = require('./Entry');

let mongoServer;

describe('Entry Model', () => {
  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    // Clear entries before each test
    await Entry.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create entry with valid date and sugarConsumed', async () => {
      const entry = new Entry({
        date: '2025-01-23',
        sugarConsumed: true,
      });

      const savedEntry = await entry.save();
      expect(savedEntry._id).toBeDefined();
      expect(savedEntry.date).toBe('2025-01-23');
      expect(savedEntry.sugarConsumed).toBe(true);
      expect(savedEntry.createdAt).toBeDefined();
      expect(savedEntry.updatedAt).toBeDefined();
    });

    test('should reject entry without date', async () => {
      const entry = new Entry({
        sugarConsumed: true,
      });

      await expect(entry.save()).rejects.toThrow();
    });

    test('should reject entry without sugarConsumed', async () => {
      const entry = new Entry({
        date: '2025-01-23',
      });

      await expect(entry.save()).rejects.toThrow();
    });

    test('should reject entry with invalid date format', async () => {
      const entry = new Entry({
        date: '01/23/2025', // Invalid format
        sugarConsumed: true,
      });

      await expect(entry.save()).rejects.toThrow('Date must be in YYYY-MM-DD format');
    });

    test('should reject entry with non-boolean sugarConsumed', async () => {
      const entry = new Entry({
        date: '2025-01-23',
        sugarConsumed: null, // Invalid type
      });

      await expect(entry.save()).rejects.toThrow();
    });
  });

  describe('Unique Date Constraint', () => {
    test('should enforce unique date constraint', async () => {
      // Create first entry
      const entry1 = new Entry({
        date: '2025-01-23',
        sugarConsumed: true,
      });
      await entry1.save();

      // Attempt to create second entry with same date
      const entry2 = new Entry({
        date: '2025-01-23',
        sugarConsumed: false,
      });

      await expect(entry2.save()).rejects.toThrow();
    });

    test('should allow entries with different dates', async () => {
      const entry1 = new Entry({
        date: '2025-01-23',
        sugarConsumed: true,
      });
      await entry1.save();

      const entry2 = new Entry({
        date: '2025-01-24',
        sugarConsumed: false,
      });
      const savedEntry2 = await entry2.save();

      expect(savedEntry2._id).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const entry = new Entry({
        date: '2025-01-23',
        sugarConsumed: true,
      });

      const savedEntry = await entry.save();
      expect(savedEntry.createdAt).toBeInstanceOf(Date);
      expect(savedEntry.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const entry = new Entry({
        date: '2025-01-23',
        sugarConsumed: true,
      });

      const savedEntry = await entry.save();
      const originalUpdatedAt = savedEntry.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      savedEntry.sugarConsumed = false;
      await savedEntry.save();

      expect(savedEntry.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  // Feature: sugar-intake-tracker, Property 3: One Entry Per Date Constraint
  describe('Property-Based Testing: One Entry Per Date Constraint', () => {
    test('should allow only one entry per date when inserting duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString().split('T')[0]),
          fc.boolean(),
          fc.boolean(),
          async (dateStr, firstStatus, secondStatus) => {
            // Clear any existing entry for this date
            await Entry.deleteMany({ date: dateStr });

            // Create first entry — should succeed
            const entry1 = new Entry({ date: dateStr, sugarConsumed: firstStatus });
            await entry1.save();

            // Attempt to create a second entry with the same date — should fail
            const entry2 = new Entry({ date: dateStr, sugarConsumed: secondStatus });
            await expect(entry2.save()).rejects.toThrow();

            // Verify only one entry exists for this date
            const entries = await Entry.find({ date: dateStr });
            expect(entries).toHaveLength(1);
            expect(entries[0].sugarConsumed).toBe(firstStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow entries with different dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two distinct dates
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.boolean(),
          fc.boolean(),
          async (date1, date2, status1, status2) => {
            const dateStr1 = date1.toISOString().split('T')[0];
            const dateStr2 = date2.toISOString().split('T')[0];

            // Skip if dates happen to be the same
            fc.pre(dateStr1 !== dateStr2);

            await Entry.deleteMany({ date: { $in: [dateStr1, dateStr2] } });

            const entry1 = new Entry({ date: dateStr1, sugarConsumed: status1 });
            const entry2 = new Entry({ date: dateStr2, sugarConsumed: status2 });

            await entry1.save();
            await entry2.save();

            // Both entries should exist
            const entries = await Entry.find({ date: { $in: [dateStr1, dateStr2] } }).sort({ date: 1 });
            expect(entries).toHaveLength(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should preserve original entry when duplicate insert is rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString().split('T')[0]),
          async (dateStr) => {
            await Entry.deleteMany({ date: dateStr });

            // Create entry with sugarConsumed = true
            const original = new Entry({ date: dateStr, sugarConsumed: true });
            await original.save();

            // Attempt duplicate with opposite value
            const duplicate = new Entry({ date: dateStr, sugarConsumed: false });
            await expect(duplicate.save()).rejects.toThrow();

            // Original entry should be unchanged
            const stored = await Entry.findOne({ date: dateStr });
            expect(stored.sugarConsumed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: sugar-intake-tracker, Property 12: Invalid Data Rejected with Error
  describe('Property-Based Testing: Invalid Data Rejection', () => {
    test('should reject entries with invalid date formats', async () => {
      // Generate strings that do NOT match YYYY-MM-DD regex pattern
      // The Entry model validates format only (regex ^\d{4}-\d{2}-\d{2}$),
      // not semantic date validity, so we test format rejection here.
      const invalidDateArb = fc.oneof(
        fc.constant(''), // Empty string
        fc.constant('invalid-date'), // Non-date string
        fc.constant('2025/01/23'), // Wrong separator
        fc.constant('01-23-2025'), // Wrong field order (MM-DD-YYYY)
        fc.constant('2025-1-23'), // Missing leading zero in month
        fc.constant('2025-01-3'), // Missing leading zero in day
        fc.constant('25-01-23'), // Two-digit year
        fc.constant('2025-01-23T00:00:00Z'), // Full ISO with time
        fc.constant(null), // Null
        fc.constant(undefined), // Undefined
        // Random strings that won't match YYYY-MM-DD
        fc.stringOf(fc.constantFrom('a', 'b', '/', ' ', '.'), { minLength: 1, maxLength: 15 })
      );

      await fc.assert(
        fc.asyncProperty(
          invalidDateArb,
          fc.boolean(),
          async (invalidDate, sugarConsumed) => {
            const entry = new Entry({
              date: invalidDate,
              sugarConsumed: sugarConsumed,
            });

            await expect(entry.save()).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject entries with invalid sugarConsumed values', async () => {
      // Mongoose Boolean type casts many truthy/falsy values (0, 1, "true", "false")
      // to boolean before custom validation runs. Only null and undefined
      // will fail the 'required' validator after casting.
      const invalidSugarArb = fc.oneof(
        fc.constant(null),
        fc.constant(undefined)
      );

      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString().split('T')[0]),
          invalidSugarArb,
          async (validDate, invalidSugarConsumed) => {
            await Entry.deleteMany({ date: validDate });

            const entry = new Entry({
              date: validDate,
              sugarConsumed: invalidSugarConsumed,
            });

            await expect(entry.save()).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject entries with missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({ sugarConsumed: true }), // Missing date
            fc.constant({ date: '2025-01-23' }), // Missing sugarConsumed
            fc.constant({}) // Missing both
          ),
          async (invalidEntry) => {
            const entry = new Entry(invalidEntry);

            await expect(entry.save()).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept entries with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString().split('T')[0]),
          fc.boolean(),
          async (validDate, sugarConsumed) => {
            // Clear any existing entry for this date
            await Entry.deleteMany({ date: validDate });

            const entry = new Entry({
              date: validDate,
              sugarConsumed: sugarConsumed,
            });

            const savedEntry = await entry.save();
            expect(savedEntry._id).toBeDefined();
            expect(savedEntry.date).toBe(validDate);
            expect(savedEntry.sugarConsumed).toBe(sugarConsumed);
            expect(savedEntry.createdAt).toBeInstanceOf(Date);
            expect(savedEntry.updatedAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

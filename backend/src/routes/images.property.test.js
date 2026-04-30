// Feature: sugar-intake-tracker, Property 8: Images Retrieved from Backend
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const fc = require('fast-check');
const app = require('../server');
const Image = require('../models/Image');

let mongoServer;

/**
 * Arbitrary: generates a valid image URL string.
 */
const validUrlArb = fc
  .webUrl({ withFragments: false, withQueryParameters: false })
  .filter((url) => url.startsWith('https://'));

/**
 * Arbitrary: generates a non-empty alt text string.
 */
const altTextArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary: generates a valid image object.
 */
const imageArb = fc.record({
  url: validUrlArb,
  alt: altTextArb,
});

describe('Property 8: Images Retrieved from Backend', () => {
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
    await Image.deleteMany({});
  });

  // **Validates: Requirements 5.1**
  test('all stored images are retrieved via GET /api/images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(imageArb, { minLength: 0, maxLength: 10 }),
        async (imageList) => {
          await Image.deleteMany({});

          // Insert images directly into the database
          if (imageList.length > 0) {
            await Image.insertMany(imageList);
          }

          // Retrieve via API
          const res = await request(app).get('/api/images');

          expect(res.status).toBe(200);
          expect(res.headers['content-type']).toMatch(/json/);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.images)).toBe(true);
          expect(res.body.images).toHaveLength(imageList.length);

          // Every stored image should appear in the response
          for (const img of imageList) {
            const found = res.body.images.find(
              (r) => r.url === img.url && r.alt === img.alt
            );
            expect(found).toBeDefined();
            expect(found._id).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 5.1**
  test('response contains _id, url, and alt for every image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(imageArb, { minLength: 1, maxLength: 5 }),
        async (imageList) => {
          await Image.deleteMany({});
          await Image.insertMany(imageList);

          const res = await request(app).get('/api/images');

          expect(res.status).toBe(200);
          for (const img of res.body.images) {
            expect(typeof img._id).toBe('string');
            expect(typeof img.url).toBe('string');
            expect(typeof img.alt).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

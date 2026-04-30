const request = require('supertest');
const app = require('../server');

describe('Health API', () => {
  describe('GET /api/health', () => {
    test('should return status ok and a timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      // Verify timestamp is a valid ISO string
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });
  });
});

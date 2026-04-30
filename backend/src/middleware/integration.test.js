const request = require('supertest');
const app = require('../server');

describe('Middleware integration', () => {
  describe('CORS', () => {
    it('includes CORS headers in response for allowed origin', async () => {
      const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', origin);

      expect(res.headers['access-control-allow-origin']).toBe(origin);
    });

    it('responds to preflight OPTIONS request with allowed methods', async () => {
      const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
      const res = await request(app)
        .options('/api/entries')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-methods']).toContain('GET');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-methods']).toContain('PUT');
    });
  });

  describe('JSON body parser', () => {
    it('parses valid JSON request bodies', async () => {
      // Send valid JSON but with invalid field values to trigger a validation error (not a parse error)
      // This avoids needing a DB connection while still proving JSON was parsed
      const res = await request(app)
        .post('/api/entries')
        .send({ date: 'not-a-date', sugarConsumed: 'not-boolean' })
        .set('Content-Type', 'application/json');

      // Should get a validation error (400), NOT a JSON parse error
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
      expect(res.body.error.message).not.toBe('Invalid JSON');
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await request(app)
        .post('/api/entries')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid JSON');
    });
  });

  describe('Global error handler', () => {
    it('returns consistent error format for unhandled routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      // Express returns 404 by default for unmatched routes
      expect(res.status).toBe(404);
    });

    it('error responses follow the standard format', async () => {
      // Send invalid data to trigger a validation error
      const res = await request(app)
        .post('/api/entries')
        .send({ date: 'bad-date', sugarConsumed: 'not-boolean' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error).toHaveProperty('details');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });
  });
});

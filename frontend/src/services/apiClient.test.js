import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError } from './apiClient.js';

describe('ApiClient', () => {
  const BASE_URL = 'http://localhost:3001';
  let client;

  beforeEach(() => {
    client = new ApiClient(BASE_URL);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a successful fetch Response
  function mockFetchResponse(body, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  }

  // ── getEntries ────────────────────────────────────────────────

  describe('getEntries', () => {
    it('fetches entries for the given date range', async () => {
      const payload = {
        success: true,
        entries: [{ date: '2025-01-15', sugarConsumed: false }],
      };
      global.fetch.mockReturnValue(mockFetchResponse(payload));

      const result = await client.getEntries('2025-01-01', '2025-01-31');

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(
        `${BASE_URL}/api/entries?startDate=2025-01-01&endDate=2025-01-31`
      );
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(result).toEqual(payload);
    });
  });

  // ── createEntry ───────────────────────────────────────────────

  describe('createEntry', () => {
    it('sends a POST with the correct body', async () => {
      const payload = {
        success: true,
        entry: { date: '2025-01-15', sugarConsumed: true },
      };
      global.fetch.mockReturnValue(mockFetchResponse(payload));

      const result = await client.createEntry('2025-01-15', true);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/api/entries`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        date: '2025-01-15',
        sugarConsumed: true,
      });
      expect(result).toEqual(payload);
    });
  });

  // ── updateEntry ───────────────────────────────────────────────

  describe('updateEntry', () => {
    it('sends a PUT to the correct URL with the correct body', async () => {
      const payload = {
        success: true,
        entry: { date: '2025-01-15', sugarConsumed: false },
      };
      global.fetch.mockReturnValue(mockFetchResponse(payload));

      const result = await client.updateEntry('2025-01-15', false);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/api/entries/2025-01-15`);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ sugarConsumed: false });
      expect(result).toEqual(payload);
    });
  });

  // ── getImages ─────────────────────────────────────────────────

  describe('getImages', () => {
    it('fetches images from the backend', async () => {
      const payload = {
        success: true,
        images: [{ url: 'https://example.com/img.jpg', alt: 'Healthy food' }],
      };
      global.fetch.mockReturnValue(mockFetchResponse(payload));

      const result = await client.getImages();

      const [url] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/api/images`);
      expect(result).toEqual(payload);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('returns health status from the backend', async () => {
      const payload = { status: 'ok', timestamp: '2025-01-15T10:30:00Z' };
      global.fetch.mockReturnValue(mockFetchResponse(payload));

      const result = await client.healthCheck();

      const [url] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/api/health`);
      expect(result).toEqual(payload);
    });
  });

  // ── Error handling ────────────────────────────────────────────

  describe('error handling', () => {
    it('throws ApiError on network failure', async () => {
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.getEntries('2025-01-01', '2025-01-31')).rejects.toThrow(ApiError);
      await global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      try {
        await client.getEntries('2025-01-01', '2025-01-31');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.message).toMatch(/network error/i);
        expect(err.status).toBeNull();
        expect(err.details).toEqual([]);
      }
    });

    it('throws ApiError with message and details for non-OK responses', async () => {
      const errorBody = {
        error: {
          message: 'Validation failed',
          details: ['Date must be in YYYY-MM-DD format'],
        },
      };
      global.fetch.mockReturnValue(mockFetchResponse(errorBody, 400));

      try {
        await client.createEntry('bad-date', true);
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.message).toBe('Validation failed');
        expect(err.status).toBe(400);
        expect(err.details).toEqual(['Date must be in YYYY-MM-DD format']);
      }
    });

    it('throws ApiError with generic message when error body has no message', async () => {
      global.fetch.mockReturnValue(mockFetchResponse({}, 500));

      try {
        await client.healthCheck();
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.message).toBe('Request failed with status 500');
        expect(err.status).toBe(500);
        expect(err.details).toEqual([]);
      }
    });

    it('throws ApiError when response body is not valid JSON', async () => {
      global.fetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token')),
        })
      );

      try {
        await client.getImages();
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.message).toBe('Invalid response from server');
        expect(err.status).toBe(200);
      }
    });
  });
});

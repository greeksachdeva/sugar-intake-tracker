/**
 * API Client Service for Sugar Intake Tracker
 *
 * Provides methods for all backend API endpoints with
 * error handling for network failures and non-OK responses.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom error class for API-related errors.
 * Carries the HTTP status code and parsed error details
 * from the backend response when available.
 */
export class ApiError extends Error {
  constructor(message, status = null, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * API Client class with methods for all Sugar Intake Tracker endpoints.
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Internal helper that executes a fetch request and handles
   * both network errors and non-OK HTTP responses.
   *
   * @param {string} path - URL path relative to baseURL
   * @param {RequestInit} [options] - fetch options
   * @returns {Promise<object>} parsed JSON response body
   * @throws {ApiError} on network failure or non-OK response
   */
  async _request(path, options = {}) {
    const url = `${this.baseURL}${path}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      throw new ApiError(
        'Network error: Unable to reach the server. Please check your connection and try again.',
        null,
        []
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        'Invalid response from server',
        response.status,
        []
      );
    }

    if (!response.ok) {
      const message =
        data?.error?.message || `Request failed with status ${response.status}`;
      const details = data?.error?.details || [];
      throw new ApiError(message, response.status, details);
    }

    return data;
  }

  /**
   * Fetch entries for a date range.
   *
   * @param {string} startDate - ISO 8601 date string (YYYY-MM-DD)
   * @param {string} endDate - ISO 8601 date string (YYYY-MM-DD)
   * @returns {Promise<object>} { success: true, entries: [...] }
   */
  async getEntries(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return this._request(`/api/entries?${params.toString()}`);
  }

  /**
   * Create a new daily entry.
   *
   * @param {string} date - ISO 8601 date string (YYYY-MM-DD)
   * @param {boolean} sugarConsumed - whether sugar was consumed
   * @returns {Promise<object>} { success: true, entry: {...} }
   */
  async createEntry(date, sugarConsumed) {
    return this._request('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ date, sugarConsumed }),
    });
  }

  /**
   * Update an existing entry (or create via upsert).
   *
   * @param {string} date - ISO 8601 date string (YYYY-MM-DD)
   * @param {boolean} sugarConsumed - whether sugar was consumed
   * @returns {Promise<object>} { success: true, entry: {...} }
   */
  async updateEntry(date, sugarConsumed) {
    return this._request(`/api/entries/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ sugarConsumed }),
    });
  }

  /**
   * Fetch all available images.
   *
   * @returns {Promise<object>} { success: true, images: [...] }
   */
  async getImages() {
    return this._request('/api/images');
  }

  /**
   * Check backend health status.
   *
   * @returns {Promise<object>} { status: "ok", timestamp: "..." }
   */
  async healthCheck() {
    return this._request('/api/health');
  }
}

/** Singleton API client instance configured with the environment base URL */
const apiClient = new ApiClient(BASE_URL);

export default apiClient;
export { ApiClient };

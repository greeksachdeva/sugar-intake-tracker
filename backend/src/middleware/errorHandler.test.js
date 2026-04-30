const errorHandler = require('./errorHandler');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('returns 400 with details for Mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        date: { message: 'Date is required' },
        sugarConsumed: { message: 'sugarConsumed must be a boolean' },
      },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Validation failed',
        details: ['Date is required', 'sugarConsumed must be a boolean'],
      },
    });
  });

  it('returns 409 for duplicate key error', () => {
    const err = { code: 11000 };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Duplicate entry',
        details: ['A record with this key already exists'],
      },
    });
  });

  it('returns 400 for malformed JSON body', () => {
    const err = { type: 'entity.parse.failed' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Invalid JSON',
        details: ['Request body contains invalid JSON'],
      },
    });
  });

  it('returns 500 with generic message for unknown errors', () => {
    const err = new Error('something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Internal server error',
        details: [],
      },
    });
  });

  it('uses custom statusCode and message when provided', () => {
    const err = new Error('Not found');
    err.statusCode = 404;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Not found',
        details: [],
      },
    });
  });

  it('includes custom details when provided on the error', () => {
    const err = new Error('Bad request');
    err.statusCode = 400;
    err.details = ['Field X is invalid'];

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Bad request',
        details: ['Field X is invalid'],
      },
    });
  });

  it('logs the error to console.error', () => {
    const err = new Error('test error');

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith('Unhandled error:', err);
  });
});

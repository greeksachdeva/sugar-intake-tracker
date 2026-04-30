const requestLogger = require('./requestLogger');

describe('requestLogger middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/entries',
    };
    res = {
      statusCode: 200,
      on: jest.fn(),
    };
    next = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('calls next() to pass control to the next middleware', () => {
    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('registers a finish event listener on the response', () => {
    requestLogger(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('logs method, URL, status code, and response time on finish', () => {
    requestLogger(req, res, next);

    // Simulate the finish event
    const finishCallback = res.on.mock.calls[0][1];
    finishCallback();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/api\/entries 200 - \d+ms$/)
    );
  });

  it('logs correct status code for error responses', () => {
    res.statusCode = 404;
    req.method = 'POST';
    req.originalUrl = '/api/entries';

    requestLogger(req, res, next);

    const finishCallback = res.on.mock.calls[0][1];
    finishCallback();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/api\/entries 404 - \d+ms$/)
    );
  });
});

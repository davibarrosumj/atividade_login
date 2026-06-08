const { test, describe, afterEach, before, after } = require('node:test');
const assert = require('node:assert');

const errorMiddleware = require('../middlewares/errorMiddleware');

function mockResponse() {
    const res = {};
    res.statusCode = 200;
    res.renderedView = null;
    res.renderedData = null;
    res.headersSent = false;
    res.nextCalled = false;

    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.render = (view, data) => {
        res.renderedView = view;
        res.renderedData = data;
        return res;
    };
    return res;
}

describe('Error Handler Middleware - Unit Tests', () => {
    
    // Suppress console.error in test outputs
    const originalConsoleError = console.error;
    before(() => {
        console.error = () => {};
    });
    
    after(() => {
        console.error = originalConsoleError;
    });

    test('should set status to 500 by default and render error view with generic message', () => {
        const err = new Error('Test unexpected crash');
        const req = {};
        const res = mockResponse();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        // Save original env
        const oldEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            errorMiddleware(err, req, res, next);

            assert.strictEqual(res.statusCode, 500);
            assert.strictEqual(res.renderedView, 'error');
            assert.strictEqual(res.renderedData.message, 'Test unexpected crash');
            assert.deepStrictEqual(res.renderedData.error, {}); // hidden in production
            assert.strictEqual(nextCalled, false);
        } finally {
            process.env.NODE_ENV = oldEnv;
        }
    });

    test('should pass status from err.status if defined', () => {
        const err = new Error('Not Found');
        err.status = 404;
        const req = {};
        const res = mockResponse();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        errorMiddleware(err, req, res, next);

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.renderedView, 'error');
    });

    test('should expose full error details if NODE_ENV is development', () => {
        const err = new Error('Dev details leak');
        const req = {};
        const res = mockResponse();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        const oldEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        try {
            errorMiddleware(err, req, res, next);

            assert.strictEqual(res.renderedData.error, err); // exposed in development
            assert.ok(res.renderedData.error.stack);
        } finally {
            process.env.NODE_ENV = oldEnv;
        }
    });

    test('should delegate to next(err) if headers are already sent', () => {
        const err = new Error('Late crash');
        const req = {};
        const res = mockResponse();
        res.headersSent = true;
        let nextCalled = false;
        let nextErr = null;
        const next = (e) => {
            nextCalled = true;
            nextErr = e;
        };

        errorMiddleware(err, req, res, next);

        assert.strictEqual(nextCalled, true);
        assert.strictEqual(nextErr, err);
        assert.strictEqual(res.renderedView, null); // should not render again
    });
});

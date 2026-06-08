const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const Donation = require('../models/donation');
const historyController = require('../controllers/historyController');

// Helpers to mock Express Request and Response
function mockRequest(body = {}, userPayload = {}, query = {}, params = {}) {
    const flashMessages = {};
    return {
        body,
        query,
        params,
        user: userPayload,
        flash(key, val) {
            if (val !== undefined) {
                flashMessages[key] = val;
            } else {
                return flashMessages[key] || '';
            }
        }
    };
}

function mockResponse() {
    const res = {};
    res.redirectedTo = null;
    res.renderedTemplate = null;
    res.renderData = null;

    res.redirect = (url) => {
        res.redirectedTo = url;
        return res;
    };
    res.render = (template, data) => {
        res.renderedTemplate = template;
        res.renderData = data;
        return res;
    };
    return res;
}

describe('History Page - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    test('should render history page with offered and received items', async () => {
        const req = mockRequest({}, { id: 2, admin: false });
        const res = mockResponse();
        const next = () => {};

        const userInstance = { id: 2, credits: 100.00 };
        mock.method(User, 'findByPk', async () => userInstance);

        const offeredItems = [{ id: 1, name: 'Item A', userId: 2 }];
        const receivedItems = [{ id: 2, name: 'Item B', receiverId: 2 }];

        let findAllCallCount = 0;
        mock.method(Donation, 'findAll', async () => {
            findAllCallCount++;
            if (findAllCallCount === 1) return offeredItems;
            return receivedItems;
        });

        await historyController.historyPage(req, res, next);

        assert.strictEqual(res.renderedTemplate, 'historico');
        assert.strictEqual(res.renderData.user, userInstance);
        assert.deepStrictEqual(res.renderData.offeredItems, offeredItems);
        assert.deepStrictEqual(res.renderData.receivedItems, receivedItems);
    });

    test('should forward database errors via next(err)', async () => {
        const req = mockRequest({}, { id: 2, admin: false });
        const res = mockResponse();

        const dbError = new Error('DB crash');
        mock.method(User, 'findByPk', async () => { throw dbError; });

        let nextError = null;
        const next = (err) => { nextError = err; };

        await historyController.historyPage(req, res, next);

        assert.strictEqual(nextError, dbError);
    });
});

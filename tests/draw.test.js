const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const Draw = require('../models/draw');
const sequelize = require('../database');
const drawController = require('../controllers/drawController');

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

describe('Draw / Sorteio - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    // =========================================================
    // simulateDraw
    // =========================================================
    describe('simulateDraw', () => {

        test('should successfully award credits to a random non-admin user', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => { };

            const luckyUser = { id: 3, name: 'Lucky User', email: 'lucky@mail.com', credits: 10.00, save: mock.fn(async () => { }) };

            let findOneWhere = null;
            mock.method(User, 'findOne', async (opts) => {
                findOneWhere = opts.where;
                return luckyUser;
            });

            let drawCreated = null;
            mock.method(Draw, 'create', async (opts) => {
                drawCreated = opts;
                return { id: 1, ...opts };
            });

            await drawController.simulateDraw(req, res, next);

            assert.strictEqual(findOneWhere.admin, false);
            assert.ok(luckyUser.credits === 60.00 || luckyUser.credits === 110.00);
            assert.strictEqual(luckyUser.save.mock.callCount(), 1);
            assert.ok(drawCreated !== null);
            assert.strictEqual(drawCreated.winnerId, 3);
            assert.strictEqual(drawCreated.adminId, 1);
            assert.strictEqual(res.redirectedTo, '/admin/sorteios');
            assert.match(req.flash('success_msg'), /Sorteio realizado! O usuário "Lucky User" \(lucky@mail.com\) recebeu R\$/);
        });

        test('should show error if no users are available for draw', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => {};

            mock.method(User, 'findOne', async () => null);

            await drawController.simulateDraw(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/sorteios');
            assert.strictEqual(req.flash('error_msg'), 'Nenhum usuário cadastrado para realizar o sorteio');
        });
    });

    // =========================================================
    // adminDrawsPage
    // =========================================================
    describe('adminDrawsPage', () => {

        test('should fetch draws with pagination and render the adminSorteios template', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, { page: '2' });
            const res = mockResponse();
            const next = () => {};

            const mockUser = { id: 1, name: 'Admin', admin: true };
            mock.method(User, 'findByPk', async () => mockUser);

            const mockDraws = [
                { id: 1, amount: 50.00, winnerId: 2, adminId: 1, createdAt: new Date() }
            ];

            let findAndCountAllOpts = null;
            mock.method(Draw, 'findAndCountAll', async (opts) => {
                findAndCountAllOpts = opts;
                return { count: 15, rows: mockDraws };
            });

            await drawController.adminDrawsPage(req, res, next);

            assert.strictEqual(findAndCountAllOpts.limit, 10);
            assert.strictEqual(findAndCountAllOpts.offset, 10);
            assert.strictEqual(res.renderedTemplate, 'adminSorteios');
            assert.strictEqual(res.renderData.user, mockUser);
            assert.strictEqual(res.renderData.draws, mockDraws);
            assert.strictEqual(res.renderData.currentPage, 2);
            assert.strictEqual(res.renderData.totalPages, 2);
            assert.strictEqual(res.renderData.totalCount, 15);
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const dbError = new Error('Database down');
            let nextError = null;
            const next = (err) => { nextError = err; };

            mock.method(User, 'findByPk', async () => { throw dbError; });

            await drawController.adminDrawsPage(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });
});

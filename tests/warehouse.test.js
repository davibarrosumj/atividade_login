const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const Donation = require('../models/donation');
const warehouseController = require('../controllers/warehouseController');

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

describe('Admin Warehouse Endpoints - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    test('adminWarehousePage should succeed if user is admin', async () => {
        const req = mockRequest({}, { id: 1, admin: true });
        const res = mockResponse();
        const next = () => { };

        const userInstance = { id: 1, admin: true };
        mock.method(User, 'findByPk', async () => userInstance);
        mock.method(Donation, 'findAll', async () => []);

        await warehouseController.adminWarehousePage(req, res, next);

        assert.strictEqual(res.renderedTemplate, 'adminArmazenagem');
        assert.ok(res.renderData.pendingEntries);
        assert.ok(res.renderData.pendingExits);
    });

    // --- confirmEntry (now sets triaged + condition) ---

    test('confirmEntry should fail if storageCode is missing', async () => {
        const req = mockRequest({ storageCode: '', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => { };

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
    });

    test('confirmEntry should fail if storageCode format is invalid', async () => {
        const invalidCodes = ['A-1', 'A1', 'a1-s2', 'A1-S', 'A1-S2-L3', '1A-S2'];
        for (const code of invalidCodes) {
            const req = mockRequest({ storageCode: code, condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            await warehouseController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
        }
    });

    test('confirmEntry should fail if condition is missing', async () => {
        const req = mockRequest({ storageCode: 'A1-S2', condition: '' }, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => {};

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'A condição do item é obrigatória');
    });

    test('confirmEntry should fail if condition is invalid', async () => {
        const req = mockRequest({ storageCode: 'A1-S2', condition: 'Excelente' }, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => {};

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'A condição do item é obrigatória');
    });

    test('confirmEntry should fail if donation is not found', async () => {
        const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 999 });
        const res = mockResponse();
        const next = () => {};

        mock.method(Donation, 'findByPk', async () => null);

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
    });

    test('confirmEntry should fail if donation status is not "registered"', async () => {
        const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => {};

        const donationInstance = { id: 10, status: 'available', save: mock.fn(async () => {}) };
        mock.method(Donation, 'findByPk', async () => donationInstance);

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'Esta doação já foi processada');
    });

    test('confirmEntry should succeed and set status to "triaged" with condition and storageCode', async () => {
        const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => { };

        const donationInstance = { id: 10, name: 'Monitor Dell', status: 'registered', storageCode: null, condition: null, save: mock.fn(async () => { }) };
        mock.method(Donation, 'findByPk', async () => donationInstance);

        await warehouseController.confirmEntry(req, res, next);

        assert.strictEqual(donationInstance.status, 'triaged');
        assert.strictEqual(donationInstance.condition, 'Bom');
        assert.strictEqual(donationInstance.storageCode, 'A1-S2');
        assert.strictEqual(donationInstance.save.mock.callCount(), 1);
        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.match(req.flash('success_msg'), /Triagem concluída/);
    });

    // --- confirmExit ---

    test('confirmExit should fail if donation is not found', async () => {
        const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 999 });
        const res = mockResponse();
        const next = () => {};

        mock.method(Donation, 'findByPk', async () => null);

        await warehouseController.confirmExit(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
    });

    test('confirmExit should fail if donation status is not "pending"', async () => {
        const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => {};

        const donationInstance = { id: 10, status: 'available', save: mock.fn(async () => {}) };
        mock.method(Donation, 'findByPk', async () => donationInstance);

        await warehouseController.confirmExit(req, res, next);

        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('error_msg'), 'Este item não possui retirada pendente');
    });

    test('confirmExit should succeed and update status to collected', async () => {
        const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 10 });
        const res = mockResponse();
        const next = () => { };

        const donationInstance = { id: 10, status: 'pending', save: mock.fn(async () => { }) };
        mock.method(Donation, 'findByPk', async () => donationInstance);

        await warehouseController.confirmExit(req, res, next);

        assert.strictEqual(donationInstance.status, 'collected');
        assert.strictEqual(donationInstance.save.mock.callCount(), 1);
        assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
        assert.strictEqual(req.flash('success_msg'), 'Entrega física confirmada com sucesso!');
    });
});

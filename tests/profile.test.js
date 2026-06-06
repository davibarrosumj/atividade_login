const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

// Set dummy JWT_SECRET if not already set by .env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_123';
}

const User = require('../models/user');
const dashController = require('../controllers/dashController');

// Helpers to mock Express Request and Response
function mockRequest(body = {}, userPayload = {}) {
    const flashMessages = {};
    return {
        body,
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
    res.cookiesSet = {};

    res.redirect = (url) => {
        res.redirectedTo = url;
        return res;
    };
    res.cookie = (name, value, options) => {
        res.cookiesSet[name] = { value, options };
        return res;
    };
    return res;
}

describe('User Profile Editing - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    test('should fail if name, email, or currentPassword is missing', async () => {
        const req = mockRequest({ name: '', email: '', currentPassword: '' }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'Nome, e-mail e senha atual são obrigatórios');
    });

    test('should fail if user is not found in database', async () => {
        const req = mockRequest({ name: 'New Name', email: 'new@mail.com', currentPassword: 'Password123' }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        mock.method(User, 'findByPk', async () => null);

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'Usuário não encontrado');
    });

    test('should fail if current password check is incorrect', async () => {
        const req = mockRequest({ name: 'New Name', email: 'new@mail.com', currentPassword: 'wrongpassword' }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        mock.method(User, 'findByPk', async () => {
            return { id: 1, name: 'Davi', email: 'davi@mail.com', password: hash };
        });

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'Senha atual incorreta');
    });

    test('should fail if email pattern is invalid', async () => {
        const req = mockRequest({ name: 'New Name', email: 'invalid-email', currentPassword: 'Password123' }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        mock.method(User, 'findByPk', async () => {
            return { id: 1, name: 'Davi', email: 'davi@mail.com', password: hash };
        });

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'E-mail inválido');
    });

    test('should fail if email is already taken by another user', async () => {
        const req = mockRequest({ name: 'New Name', email: 'taken@mail.com', currentPassword: 'Password123' }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        mock.method(User, 'findByPk', async () => {
            return { id: 1, name: 'Davi', email: 'davi@mail.com', password: hash };
        });

        // Mock findOne to return another user owning 'taken@mail.com'
        mock.method(User, 'findOne', async () => {
            return { id: 2, email: 'taken@mail.com' };
        });

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'E-mail já está em uso por outro usuário');
    });

    test('should fail if new passwords do not match', async () => {
        const req = mockRequest({
            name: 'New Name',
            email: 'new@mail.com',
            currentPassword: 'Password123',
            newPassword: 'Password456',
            confirmNewPassword: 'Password789'
        }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        mock.method(User, 'findByPk', async () => {
            return { id: 1, name: 'Davi', email: 'davi@mail.com', password: hash };
        });

        mock.method(User, 'findOne', async () => null);

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('error_msg'), 'As novas senhas não coincidem');
    });

    test('should fail if new password does not meet password policy requirements', async () => {
        const req = mockRequest({
            name: 'New Name',
            email: 'new@mail.com',
            currentPassword: 'Password123',
            newPassword: 'weak',
            confirmNewPassword: 'weak'
        }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        mock.method(User, 'findByPk', async () => {
            return { id: 1, name: 'Davi', email: 'davi@mail.com', password: hash };
        });

        mock.method(User, 'findOne', async () => null);

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.match(req.flash('error_msg'), /A nova senha deve ter pelo menos 8 caracteres/);
    });

    test('should successfully update name, email and password, re-issuing cookie', async () => {
        const req = mockRequest({
            name: 'New Name',
            email: 'new@mail.com',
            currentPassword: 'Password123',
            newPassword: 'NewPassword123',
            confirmNewPassword: 'NewPassword123'
        }, { id: 1 });
        const res = mockResponse();
        const next = () => {};

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123', 10);

        const saveSpy = mock.fn(async () => {});
        const userInstance = {
            id: 1,
            name: 'Davi',
            email: 'davi@mail.com',
            password: hash,
            admin: false,
            save: saveSpy
        };

        mock.method(User, 'findByPk', async () => userInstance);
        mock.method(User, 'findOne', async () => null);

        await dashController.updateProfile(req, res, next);

        // Verify save was called and user attributes updated
        assert.strictEqual(saveSpy.mock.callCount(), 1);
        assert.strictEqual(userInstance.name, 'New Name');
        assert.strictEqual(userInstance.email, 'new@mail.com');
        
        // Verify new password was hashed and saved
        const isNewPasswordMatch = await bcrypt.compare('NewPassword123', userInstance.password);
        assert.strictEqual(isNewPasswordMatch, true);

        // Verify redirect and flash success
        assert.strictEqual(res.redirectedTo, '/dashboard');
        assert.strictEqual(req.flash('success_msg'), 'Perfil atualizado com sucesso!');

        // Verify cookie was updated
        assert.ok(res.cookiesSet.token);
        const payload = jwt.verify(res.cookiesSet.token.value, process.env.JWT_SECRET);
        assert.strictEqual(payload.id, 1);
        assert.strictEqual(payload.name, 'New Name');
        assert.strictEqual(payload.email, 'new@mail.com');
        assert.strictEqual(payload.admin, false);
    });

    test('should forward database errors via next(err)', async () => {
        const req = mockRequest({ name: 'New Name', email: 'new@mail.com', currentPassword: 'Password123' }, { id: 1 });
        const res = mockResponse();

        const dbError = new Error('Database findByPk crash');
        mock.method(User, 'findByPk', async () => {
            throw dbError;
        });

        let nextCalled = false;
        let nextError = null;
        const next = (err) => {
            nextCalled = true;
            nextError = err;
        };

        await dashController.updateProfile(req, res, next);

        assert.strictEqual(nextCalled, true);
        assert.strictEqual(nextError, dbError);
    });
});

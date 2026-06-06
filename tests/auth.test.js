const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

// Set dummy JWT_SECRET if not already set by .env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_123';
}

const User = require('../models/user');
const authController = require('../controllers/authController');
const { protect, redirectIfAuthenticated } = require('../middlewares/authMiddleware');

// Helpers to mock Express Request and Response
function mockRequest(body = {}, cookies = {}, session = {}) {
    const flashMessages = {};
    return {
        body,
        cookies,
        session: {
            ...session,
            destroy(callback) {
                if (callback) callback();
            }
        },
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
    res.renderedView = null;
    res.renderedData = null;
    res.clearedCookies = [];
    res.cookiesSet = {};

    res.redirect = (url) => {
        res.redirectedTo = url;
        return res;
    };
    res.render = (view, data) => {
        res.renderedView = view;
        res.renderedData = data;
        return res;
    };
    res.cookie = (name, value, options) => {
        res.cookiesSet[name] = { value, options };
        return res;
    };
    res.clearCookie = (name) => {
        res.clearedCookies.push(name);
        return res;
    };
    return res;
}

describe('Authentication Flow - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    describe('authController.register', () => {

        test('should fail if any required field is missing', async () => {
            const req = mockRequest({ name: '', email: '', password: '', confirmPassword: '' });
            const res = mockResponse();
            const next = () => {};

            await authController.register(req, res, next);

            assert.strictEqual(res.redirectedTo, '/register');
            assert.strictEqual(req.flash('error_msg'), 'Todos os campos são obrigatórios');
        });

        test('should fail if email format is invalid', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'invalid-email',
                password: 'Password123',
                confirmPassword: 'Password123'
            });
            const res = mockResponse();
            const next = () => {};

            await authController.register(req, res, next);

            assert.strictEqual(res.redirectedTo, '/register');
            assert.strictEqual(req.flash('error_msg'), 'E-mail inválido');
        });

        test('should fail if password does not meet complexity requirements', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'davi@mail.com',
                password: 'weak',
                confirmPassword: 'weak'
            });
            const res = mockResponse();
            const next = () => {};

            await authController.register(req, res, next);

            assert.strictEqual(res.redirectedTo, '/register');
            assert.match(req.flash('error_msg'), /A senha deve ter pelo menos 8 caracteres/);
        });

        test('should fail if passwords do not match', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'davi@mail.com',
                password: 'Password123',
                confirmPassword: 'Password124'
            });
            const res = mockResponse();
            const next = () => {};

            await authController.register(req, res, next);

            assert.strictEqual(res.redirectedTo, '/register');
            assert.strictEqual(req.flash('error_msg'), 'As senhas não coincidem');
        });

        test('should fail if email is already registered', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'davi@mail.com',
                password: 'Password123',
                confirmPassword: 'Password123'
            });
            const res = mockResponse();
            const next = () => {};

            // Mock User.findOne to return a mocked existing user
            mock.method(User, 'findOne', async () => {
                return { email: 'davi@mail.com' };
            });

            await authController.register(req, res, next);

            assert.strictEqual(res.redirectedTo, '/register');
            assert.strictEqual(req.flash('error_msg'), 'E-mail já cadastrado');
        });

        test('should register user successfully and redirect to login page', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'davi@mail.com',
                password: 'Password123',
                confirmPassword: 'Password123'
            });
            const res = mockResponse();
            const next = () => {};

            // Mock User.findOne to return null (does not exist)
            mock.method(User, 'findOne', async () => {
                return null;
            });

            // Mock User.create to return a new user object
            const createMock = mock.method(User, 'create', async (data) => {
                return { id: 1, ...data };
            });

            await authController.register(req, res, next);

            assert.strictEqual(createMock.mock.callCount(), 1);
            const createdData = createMock.mock.calls[0].arguments[0];
            assert.strictEqual(createdData.name, 'Davi Barros');
            assert.strictEqual(createdData.email, 'davi@mail.com');
            assert.strictEqual(createdData.admin, false);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('success_msg'), 'Cadastro realizado com sucesso! Faça login.');
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({
                name: 'Davi Barros',
                email: 'davi@mail.com',
                password: 'Password123',
                confirmPassword: 'Password123'
            });
            const res = mockResponse();
            
            const dbError = new Error('Database connection failed');
            mock.method(User, 'findOne', async () => {
                throw dbError;
            });

            let nextCalled = false;
            let nextError = null;
            const next = (err) => {
                nextCalled = true;
                nextError = err;
            };

            await authController.register(req, res, next);

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(nextError, dbError);
        });
    });

    describe('authController.login', () => {

        test('should fail if fields are missing', async () => {
            const req = mockRequest({ email: '', password: '' });
            const res = mockResponse();
            const next = () => {};

            await authController.login(req, res, next);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('error_msg'), 'Todos os campos são obrigatórios');
        });

        test('should fail if user is not found in database', async () => {
            const req = mockRequest({ email: 'davi@mail.com', password: 'Password123' });
            const res = mockResponse();
            const next = () => {};

            mock.method(User, 'findOne', async () => {
                return null;
            });

            await authController.login(req, res, next);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('error_msg'), 'Usuário inválido');
        });

        test('should fail if password check is incorrect', async () => {
            const req = mockRequest({ email: 'davi@mail.com', password: 'wrong-password' });
            const res = mockResponse();
            const next = () => {};

            // Mock User.findOne to return user with hashed password (password: Password123)
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('Password123', 10);
            mock.method(User, 'findOne', async () => {
                return { email: 'davi@mail.com', password: hash };
            });

            await authController.login(req, res, next);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('error_msg'), 'Senha inválida');
        });

        test('should log in successfully and redirect to dashboard', async () => {
            const req = mockRequest({ email: 'davi@mail.com', password: 'Password123' });
            const res = mockResponse();
            const next = () => {};

            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('Password123', 10);
            mock.method(User, 'findOne', async () => {
                return { id: 1, name: 'Davi Barros', email: 'davi@mail.com', password: hash, admin: true };
            });

            await authController.login(req, res, next);

            assert.strictEqual(res.redirectedTo, '/dashboard');
            assert.strictEqual(req.flash('success_msg'), 'Login realizado com sucesso!');
            assert.ok(res.cookiesSet.token);
            assert.ok(res.cookiesSet.token.value);
            
            // Verify JWT payload
            const payload = jwt.verify(res.cookiesSet.token.value, process.env.JWT_SECRET);
            assert.strictEqual(payload.id, 1);
            assert.strictEqual(payload.name, 'Davi Barros');
            assert.strictEqual(payload.email, 'davi@mail.com');
            assert.strictEqual(payload.admin, true);
        });

        test('should forward database errors during login via next(err)', async () => {
            const req = mockRequest({ email: 'davi@mail.com', password: 'Password123' });
            const res = mockResponse();
            
            const dbError = new Error('Database lookup failure');
            mock.method(User, 'findOne', async () => {
                throw dbError;
            });

            let nextCalled = false;
            let nextError = null;
            const next = (err) => {
                nextCalled = true;
                nextError = err;
            };

            await authController.login(req, res, next);

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(nextError, dbError);
        });
    });

    describe('authMiddleware.protect', () => {

        test('should redirect if token is missing', () => {
            const req = mockRequest(null, {}); // empty cookies
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            protect(req, res, next);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('error_msg'), 'Token expirado');
            assert.strictEqual(nextCalled, false);
        });

        test('should redirect if token is invalid', () => {
            const req = mockRequest(null, { token: 'invalid' });
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            protect(req, res, next);

            assert.strictEqual(res.redirectedTo, '/');
            assert.strictEqual(req.flash('error_msg'), 'Erro desconhecido');
            assert.strictEqual(nextCalled, false);
        });

        test('should pass verification and populate req.user if token is valid', () => {
            const payload = { id: 1, name: 'Davi Barros', admin: false };
            const token = jwt.sign(payload, process.env.JWT_SECRET);

            const req = mockRequest(null, { token });
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            protect(req, res, next);

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(req.user.id, 1);
            assert.strictEqual(req.user.name, 'Davi Barros');
            assert.strictEqual(req.user.admin, false);
        });
    });

    describe('authMiddleware.redirectIfAuthenticated', () => {

        test('should call next if no token is present', () => {
            const req = mockRequest(null, {});
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            redirectIfAuthenticated(req, res, next);

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(res.redirectedTo, null);
        });

        test('should clear cookie and call next if token is invalid', () => {
            const req = mockRequest(null, { token: 'invalid' });
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            redirectIfAuthenticated(req, res, next);

            assert.strictEqual(nextCalled, true);
            assert.deepStrictEqual(res.clearedCookies, ['token']);
            assert.strictEqual(res.redirectedTo, null);
        });

        test('should redirect to dashboard if token is valid', () => {
            const payload = { id: 1, name: 'Davi Barros' };
            const token = jwt.sign(payload, process.env.JWT_SECRET);

            const req = mockRequest(null, { token });
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            redirectIfAuthenticated(req, res, next);

            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.redirectedTo, '/dashboard');
        });
    });
});

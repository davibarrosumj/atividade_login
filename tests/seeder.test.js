const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const { seedDatabase } = require('../utils/seeder');

describe('Database Seeding Utility - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    test('should seed database with one admin and one regular user if database is empty', async () => {
        // Mock User.count to return 0
        const countMock = mock.method(User, 'count', async () => 0);
        
        // Mock User.create
        const createMock = mock.method(User, 'create', async (data) => {
            return { id: 1, ...data };
        });

        // Suppress console.log to keep test output clean
        const originalLog = console.log;
        console.log = () => {};

        try {
            await seedDatabase();
        } finally {
            console.log = originalLog;
        }

        assert.strictEqual(countMock.mock.callCount(), 1);
        assert.strictEqual(createMock.mock.callCount(), 2);

        // Verify first user created is Admin
        const adminCall = createMock.mock.calls[0].arguments[0];
        assert.strictEqual(adminCall.name, 'Administrador');
        assert.strictEqual(adminCall.email, 'admin@mail.com');
        assert.strictEqual(adminCall.admin, true);

        // Verify second user created is Regular User
        const userCall = createMock.mock.calls[1].arguments[0];
        assert.strictEqual(userCall.name, 'Usuário Comum');
        assert.strictEqual(userCall.email, 'user@mail.com');
        assert.strictEqual(userCall.admin, false);
    });

    test('should skip database seeding if database is not empty', async () => {
        // Mock User.count to return 2
        const countMock = mock.method(User, 'count', async () => 2);
        
        // Mock User.create
        const createMock = mock.method(User, 'create', async () => {
            return {};
        });

        const originalLog = console.log;
        console.log = () => {};

        try {
            await seedDatabase();
        } finally {
            console.log = originalLog;
        }

        assert.strictEqual(countMock.mock.callCount(), 1);
        assert.strictEqual(createMock.mock.callCount(), 0); // No user should be created
    });
});

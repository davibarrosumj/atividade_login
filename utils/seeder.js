const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function seedDatabase() {
    try {
        const count = await User.count();
        if (count === 0) {
            console.log('User table is empty. Starting database seeding...');

            const password = process.env.PU_PASSWORD;
            const hash = await bcrypt.hash(password, 10);

            // Create Admin
            await User.create({
                name: 'Administrador',
                email: 'admin@mail.com',
                password: hash,
                admin: true
            });

            // Create Regular User
            await User.create({
                name: 'Usuário Comum',
                email: 'user@mail.com',
                password: hash,
                admin: false
            });

            console.log('Database seeded successfully!');
        } else {
            console.log('Database already contains users. Skipping seeding.');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

module.exports = {
    seedDatabase
};

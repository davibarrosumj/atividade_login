require('dotenv').config();

const bcrypt = require('bcryptjs');

const sequelize = require('../database');
const User = require('../models/userModel');


exports.getLoginPage = (req, res) => res.render('login');


exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }});
    
    if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(400).json({ message: 'Senha inválida' });
    }

    req.session.user = {
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPowerUser: user.isPowerUser
    };

    res.redirect('/dashboard');
};


exports.postLogout = (req, res) => {
    req.session.destroy();

    res.redirect('/');
};


exports.postRegister = async (req, res) => {
    res.redirect('/cadastro');
};


exports.ensurePowerUser = async () => {
    const password = await bcrypt.hash(process.env.POWER_USER_PASSWORD, 10);
    const powerUser = await User.findOne({ where: { email: 'admin@mail.com' } });

    if (powerUser) {
        await powerUser.update({
            name: 'admin',
            password,
            userType: 'super',
            isPowerUser: true
        });
        return;
    }

    await User.create({
        name: 'admin',
        email: 'admin@mail.com',
        password,
        userType: 'super',
        isPowerUser: true
    });
};


exports.initializeSystem = async () => {
    await sequelize.sync({ force: true });
    await exports.ensurePowerUser();
};

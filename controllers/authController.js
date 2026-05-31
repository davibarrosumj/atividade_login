require('dotenv').config();

const bcrypt = require('bcryptjs');

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

    req.session.user = { name: user.name, email: user.email };

    res.redirect('/dashboard');
};


exports.postLogout = (req, res) => {
    req.session.destroy();

    res.redirect('/');
};


exports.postRegister = async (req, res) => {
    res.redirect('/cadastro');
};
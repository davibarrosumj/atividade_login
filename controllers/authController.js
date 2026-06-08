require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { isValidEmail, isValidPassword } = require('../utils/validation');

exports.loginPage = (req, res) => res.render('login');

exports.registerPage = (req, res) => res.render('register');

exports.register = async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        req.flash('error_msg', 'Todos os campos são obrigatórios');
        return res.redirect('/register');
    }

    if (!isValidEmail(email)) {
        req.flash('error_msg', 'E-mail inválido');
        return res.redirect('/register');
    }

    if (!isValidPassword(password)) {
        req.flash('error_msg', 'A senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula e 1 número');
        return res.redirect('/register');
    }

    if (password !== confirmPassword) {
        req.flash('error_msg', 'As senhas não coincidem');
        return res.redirect('/register');
    }

    try {
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            req.flash('error_msg', 'E-mail já cadastrado');
            return res.redirect('/register');
        }

        const hash = await bcrypt.hash(password, 10);
        await User.create({
            name,
            email,
            password: hash,
            admin: false
        });

        req.flash('success_msg', 'Cadastro realizado com sucesso! Faça login.');
        return res.redirect('/');
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        req.flash('error_msg', 'Todos os campos são obrigatórios');
        return res.redirect('/');
    }

    try {
        const user = await User.findOne({
            where: { email }
        });
        
        if (!user) {
            req.flash('error_msg', 'Usuário inválido');
            return res.redirect('/');
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            req.flash('error_msg', 'Senha inválida');
            return res.redirect('/');
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, admin: user.admin, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        req.flash('success_msg', 'Login realizado com sucesso!');
        return res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    req.session.destroy(() => {
        res.redirect('/');
    });
};

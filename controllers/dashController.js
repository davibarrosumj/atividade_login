require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/user');
const { isValidEmail, isValidPassword } = require('../utils/validation');
const { generateToken, setTokenCookie } = require('../utils/token');

exports.dashboardPage = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.render('dashboard', { user });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;

    if (!name || !email || !currentPassword) {
        req.flash('error_msg', 'Nome, e-mail e senha atual são obrigatórios');
        return res.redirect('/dashboard');
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            req.flash('error_msg', 'Usuário não encontrado');
            return res.redirect('/dashboard');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Senha atual incorreta');
            return res.redirect('/dashboard');
        }

        if (!isValidEmail(email)) {
            req.flash('error_msg', 'E-mail inválido');
            return res.redirect('/dashboard');
        }

        const emailTaken = await User.findOne({
            where: {
                email,
                id: { [Op.ne]: userId }
            }
        });
        if (emailTaken) {
            req.flash('error_msg', 'E-mail já está em uso por outro usuário');
            return res.redirect('/dashboard');
        }

        user.name = name;
        user.email = email;

        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                req.flash('error_msg', 'As novas senhas não coincidem');
                return res.redirect('/dashboard');
            }

            if (!isValidPassword(newPassword)) {
                req.flash('error_msg', 'A nova senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula e 1 número');
                return res.redirect('/dashboard');
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        const token = generateToken(user);
        setTokenCookie(res, token);

        req.flash('success_msg', 'Perfil atualizado com sucesso!');
        return res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
};

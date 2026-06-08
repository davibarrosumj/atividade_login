require('dotenv').config();

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.flash('error_msg', 'Token expirado');
        return res.redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        req.flash('error_msg', 'Erro desconhecido');
        return res.redirect('/');
    }
};

const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch {
            res.clearCookie('token');
        }
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.admin) {
        return next();
    }
    req.flash('error_msg', 'Acesso negado. Apenas administradores.');
    return res.redirect('/doacoes');
};

module.exports = {
    protect,
    redirectIfAuthenticated,
    isAdmin
};

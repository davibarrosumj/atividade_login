require('dotenv').config();

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.flash('error_msg', 'Token expirado');
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        req.flash('error_msg', 'Erro desconhecido');
        return res.redirect("/login");
    }
};

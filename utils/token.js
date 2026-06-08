require('dotenv').config();

const jwt = require('jsonwebtoken');

function generateToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, admin: user.admin, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

function setTokenCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
}

module.exports = { generateToken, setTokenCookie };

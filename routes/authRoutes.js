const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middlewares/authMiddleware');


router.get('/', redirectIfAuthenticated, authController.loginPage);
router.get('/register', redirectIfAuthenticated, authController.registerPage);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;

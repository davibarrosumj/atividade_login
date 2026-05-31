const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const dashController = require('../controllers/dashController');
const userController = require('../controllers/userController');

const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authController.getLoginPage);
router.get('/cadastro', userController.getCadastro);
router.get('/dashboard', authMiddleware, dashController.getDashboard);

router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/cadastro', userController.postCadastro);
router.post('/register', authController.postRegister);

module.exports = router;

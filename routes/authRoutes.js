const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const dashController = require('../controllers/dashController');
const userController = require('../controllers/userController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminStatusMiddleware = require('../middlewares/adminStatusMiddleware');

router.get('/', authController.getLoginPage);
router.get('/cadastro', adminStatusMiddleware, userController.getCadastro);
router.get('/dashboard', authMiddleware, adminStatusMiddleware, dashController.getDashboard);

router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/cadastro', adminStatusMiddleware, userController.postCadastro);
router.post('/register', authController.postRegister);

router.initializeSystem = authController.initializeSystem;

module.exports = router;

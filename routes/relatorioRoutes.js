const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/', authMiddleware, adminStatusMiddleware, authorize(['super']), relatorioController.getRelatorios);

module.exports = router;

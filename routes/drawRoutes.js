const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middlewares/authMiddleware');
const drawController = require('../controllers/drawController');

router.post('/sorteio', protect, isAdmin, drawController.simulateDraw);
router.get('/admin/sorteios', protect, isAdmin, drawController.adminDrawsPage);

module.exports = router;

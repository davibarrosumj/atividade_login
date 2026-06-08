const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationController');

router.post('/sorteio', protect, isAdmin, donationController.simulateDraw);
router.get('/admin/sorteios', protect, isAdmin, donationController.adminDrawsPage);

module.exports = router;

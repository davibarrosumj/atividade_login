const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationController');

router.get('/historico', protect, donationController.historyPage);

module.exports = router;

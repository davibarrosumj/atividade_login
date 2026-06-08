const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const historyController = require('../controllers/historyController');

router.get('/historico', protect, historyController.historyPage);

module.exports = router;

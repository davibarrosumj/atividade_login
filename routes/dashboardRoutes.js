const express = require('express');
const router = express.Router();

const dashController = require('../controllers/dashController');

const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/', authMiddleware, adminStatusMiddleware, authorize(['simple', 'power', 'super']), dashController.getDashboard);

module.exports = router;

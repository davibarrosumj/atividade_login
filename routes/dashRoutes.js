const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const dashController = require('../controllers/dashController');


router.get('/dashboard', protect, dashController.dashboardPage);
router.post('/dashboard/profile', protect, dashController.updateProfile);

module.exports = router;

const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationController');

// Admin Warehouse / Storage Routes
router.get('/admin/armazenagem', protect, isAdmin, donationController.adminWarehousePage);
router.post('/admin/armazenagem/entrada/:id', protect, isAdmin, donationController.confirmEntry);
router.post('/admin/armazenagem/saida/:id', protect, isAdmin, donationController.confirmExit);

module.exports = router;

const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middlewares/authMiddleware');
const warehouseController = require('../controllers/warehouseController');

// Admin Warehouse / Storage Routes
router.get('/admin/armazenagem', protect, isAdmin, warehouseController.adminWarehousePage);
router.post('/admin/armazenagem/entrada/:id', protect, isAdmin, warehouseController.confirmEntry);
router.post('/admin/armazenagem/saida/:id', protect, isAdmin, warehouseController.confirmExit);

module.exports = router;

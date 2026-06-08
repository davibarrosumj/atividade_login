const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationController');

router.get('/doacoes', protect, donationController.listDonations);
router.get('/doacoes/nova', protect, donationController.registerDonationPage);
router.post('/doacoes/nova', protect, donationController.createDonation);
router.post('/doacoes/receber/:id', protect, donationController.claimDonation);
router.post('/doacoes/confirmar-triagem/:id', protect, donationController.confirmTriage);
router.post('/doacoes/cancelar-triagem/:id', protect, donationController.cancelTriage);

module.exports = router;

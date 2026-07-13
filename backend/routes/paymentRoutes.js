const express = require('express');
const router = express.Router();
const { createQrCode } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/qr-code', protect, createQrCode);
router.post('/qr-code', protect, createQrCode);

module.exports = router;

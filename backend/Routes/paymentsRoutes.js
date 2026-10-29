const express = require('express');
const {
   getUnpaidInvoices, createPayment, paymentReversal, paymentHeadList, paymentEnteries, paymentEnteriesDirectGl

} = require('../controller/paymemts/paymentController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/getUnpaidInvoices', authenticateToken, getUnpaidInvoices);
router.post('/createPayment', authenticateToken, createPayment);
router.post('/paymentReversal', authenticateToken, paymentReversal);
router.post('/paymentHeadList', authenticateToken, paymentHeadList);
router.post('/paymentEnteries', authenticateToken, paymentEnteries);
router.post('/paymentEnteriesDirectGl', authenticateToken, paymentEnteriesDirectGl);








module.exports = router;
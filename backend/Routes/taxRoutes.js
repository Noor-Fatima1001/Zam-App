const express = require('express');
const {
    createTax, getTaxList, updateTax
    

} = require('../controller/tax/taxController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createTax', authenticateToken, createTax);
router.post('/getTaxList', authenticateToken, getTaxList);
router.post('/updateTax', authenticateToken, updateTax);






module.exports = router;
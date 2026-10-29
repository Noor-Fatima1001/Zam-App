const express = require('express');
const {
   createBank,updateBank,getBankList,
   assignBankToCompany, updateBankToCompany, getAssignedBankToCompany

} = require('../controller/bank/bankController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createBank', authenticateToken, createBank);
router.post('/updateBank', authenticateToken, updateBank);
router.post('/getBankList', authenticateToken, getBankList);

router.post('/assignBankToCompany', authenticateToken, assignBankToCompany);
router.post('/updateBankToCompany', authenticateToken, updateBankToCompany);
router.post('/getAssignedBankToCompany', authenticateToken, getAssignedBankToCompany);







module.exports = router;
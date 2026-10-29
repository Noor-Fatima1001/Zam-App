const express = require('express');
const {
    createCoaMainHead, updateCoaMainHead, getCoaMainHead, createCoaSubHead, updateCoaSubHead, getCoaSubHead, createCoa, getCoa, updateCoa

} = require('../controller/chartOfAccounts/coaController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createCoaMainHead', authenticateToken, createCoaMainHead);
router.post('/updateCoaMainHead', authenticateToken, updateCoaMainHead);
router.post('/getCoaMainHead', authenticateToken, getCoaMainHead);
router.post('/createCoaSubHead', authenticateToken, createCoaSubHead);
router.post('/updateCoaSubHead', authenticateToken, updateCoaSubHead);
router.post('/getCoaSubHead', authenticateToken, getCoaSubHead);
router.post('/createCoa', authenticateToken, createCoa);
router.post('/getCoa', authenticateToken, getCoa);
router.post('/updateCoa', authenticateToken, updateCoa);






module.exports = router;
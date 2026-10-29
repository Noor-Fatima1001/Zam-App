const express = require('express');
const {
    createUnitMaster,updateUnitMaster, getUnitMaster, createUnitList, updateUnitList, getUnitList,
    createConversion, updateConversion, getConversionList, getConverisonQtyPrice

} = require('../controller/product/unitsController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createUnitMaster', authenticateToken, createUnitMaster);
router.post('/updateUnitMaster', authenticateToken, updateUnitMaster);
router.post('/getUnitMaster', authenticateToken, getUnitMaster);
router.post('/createUnitList', authenticateToken, createUnitList);
router.post('/updateUnitList', authenticateToken, updateUnitList);
router.post('/getUnitList', authenticateToken, getUnitList);

router.post('/createConversion', authenticateToken, createConversion);
router.post('/updateConversion', authenticateToken, updateConversion);
router.post('/getConversionList', authenticateToken, getConversionList);
router.post('/getConverisonQtyPrice', authenticateToken, getConverisonQtyPrice);






module.exports = router;
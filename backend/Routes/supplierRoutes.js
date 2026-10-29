const express = require('express');
const {
    createSupplier, updateSupplier, getSuppliersList, assignTaxToSupplier, updateTaxToSupplier, getAssignedTaxToSupplierList
    

} = require('../controller/suppliers/supplierController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createSupplier', authenticateToken, createSupplier);
router.post('/updateSupplier', authenticateToken, updateSupplier);
router.post('/getSuppliersList', authenticateToken, getSuppliersList);
router.post('/assignTaxToSupplier', authenticateToken, assignTaxToSupplier);
router.post('/updateTaxToSupplier', authenticateToken, updateTaxToSupplier);
router.post('/getAssignedTaxToSupplierList', authenticateToken, getAssignedTaxToSupplierList);






module.exports = router;
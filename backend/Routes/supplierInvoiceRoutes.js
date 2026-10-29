const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
    createInvoice,
    getInvoiceHeaderList,
    getInvoiceEnteriesList,
    supInvEntryDelete,
    invoiceReversal,
    supInvDelete,
    bulkCreateInvoices,
    uploadAndCreateInvoices
} = require('../controller/supplierInvoice/supplierInvoiceController.js');
const { authenticateToken } = require('../utils/JWTAuthenticate.js');

// Multer config
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Routes
router.post('/createInvoice', authenticateToken, createInvoice);
router.post('/getInvoiceHeaderList', authenticateToken, getInvoiceHeaderList);
router.post('/getInvoiceEnteriesList', authenticateToken, getInvoiceEnteriesList);
router.post('/supInvEntryDelete', authenticateToken, supInvEntryDelete);
router.post('/invoiceReversal', authenticateToken, invoiceReversal);
router.post('/supInvDelete', authenticateToken, supInvDelete);
router.post('/bulkCreateInvoices', authenticateToken, bulkCreateInvoices);

// 🚀 Excel upload + create
router.post('/uploadExcelInvoices', authenticateToken, upload.single('file'), uploadAndCreateInvoices);

module.exports = router;

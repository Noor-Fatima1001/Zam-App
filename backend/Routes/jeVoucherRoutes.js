const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const {
    createJeVoucher, getJeVouchers, getJeHeaderList, getJeEntriesList, reversalJeVoucher, getTrialBalance,
    getJournalLedger, getBalanceSheet, getSupplierLedger, uploadAndCreateJv

} = require('../controller/jeVoucher/jeVoucher.js');

const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here


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

router.post('/createJeVoucher', authenticateToken, createJeVoucher);
router.post('/getJeVouchers', authenticateToken, getJeVouchers);
router.post('/getJeHeaderList', authenticateToken, getJeHeaderList);
router.post('/getJeEntriesList', authenticateToken, getJeEntriesList);
router.post('/reversalJeVoucher', authenticateToken, reversalJeVoucher);
router.post('/getTrialBalance', authenticateToken, getTrialBalance);
router.post('/getJournalLedger', authenticateToken, getJournalLedger);
router.post('/getBalanceSheet', authenticateToken, getBalanceSheet);
router.post('/getSupplierLedger', authenticateToken, getSupplierLedger);

router.post('/uploadExcelJvs', authenticateToken, upload.single('file'), uploadAndCreateJv);





module.exports = router;
const express = require('express');
const {
    createCompany,getAllCompany, 
    updateCompany, assignUserToCompany, 
    getCompanyToDept, createFiscalYear, 
    getFiscalYears, closingOfFiscalYears,
    getFiscalYearsMonths, closingOfFiscalYearMonth,
    assignInterCompnayGl, updateInterCompnayGl, getInterCompanyGl

} = require('../controller/company/companyController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createCompany', authenticateToken, createCompany);
router.post('/getAllCompany', authenticateToken, getAllCompany);
router.post('/updateCompany', authenticateToken, updateCompany);
router.post('/assignUserToCompany', authenticateToken, assignUserToCompany);
router.post('/getCompanyToDept', authenticateToken, getCompanyToDept);
router.post('/createFiscalYear', authenticateToken, createFiscalYear);
router.post('/getFiscalYears', authenticateToken, getFiscalYears);
router.post('/closingOfFiscalYears', authenticateToken, closingOfFiscalYears);
router.post('/getFiscalYearsMonths', authenticateToken, getFiscalYearsMonths);
router.post('/closingOfFiscalYearMonth', authenticateToken, closingOfFiscalYearMonth);
router.post('/assignInterCompnayGl', authenticateToken, assignInterCompnayGl);
router.post('/updateInterCompnayGl', authenticateToken, updateInterCompnayGl);
router.post('/getInterCompanyGl', authenticateToken, getInterCompanyGl);





module.exports = router;
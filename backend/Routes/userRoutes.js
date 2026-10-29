const express = require('express');
const { home,login, createUser, getAllUsers, updateUser,getSingleUser, getUserFilters,getUserToCompany,
    getUserToDept, updateUserToDept, updateUserToCompany,getSalesData, postSalesData} = require('../controller/user/userController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.get('/', home);
router.post('/login', login);
router.post('/createUser', authenticateToken, createUser);
router.get('/getAllUsers', authenticateToken, getAllUsers);
router.post('/updateUser', authenticateToken, updateUser);
router.post('/getSingleUser', authenticateToken, getSingleUser);
router.post('/getUserFilters', authenticateToken, getUserFilters);
router.post('/getUserToCompany', authenticateToken, getUserToCompany);
router.post('/getUserToDept', authenticateToken, getUserToDept);
router.post('/updateUserToDept', authenticateToken, updateUserToDept);
router.post('/updateUserToCompany', authenticateToken, updateUserToCompany);
router.post('/getSalesData', authenticateToken, getSalesData);
router.post('/postSalesData', authenticateToken, postSalesData);


module.exports = router;
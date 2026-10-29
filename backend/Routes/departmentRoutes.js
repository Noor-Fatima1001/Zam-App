const express = require('express');
const {
    createDepartment,getAllDepartment, updateDepartment,assignDeptToCom, assignDeptToUsers, updateDeptToCom

} = require('../controller/department/departmentController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createDepartment', authenticateToken, createDepartment);
router.post('/getAllDepartment', authenticateToken, getAllDepartment);
router.post('/updateDepartment', authenticateToken, updateDepartment);
router.post('/assignDeptToCom', authenticateToken, assignDeptToCom);
router.post('/assignDeptToUsers', authenticateToken, assignDeptToUsers);
router.post('/updateDeptToCom', authenticateToken, updateDeptToCom);





module.exports = router;
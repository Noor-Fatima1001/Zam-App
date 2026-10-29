const express = require('express');
const {
    createmodule, getAllModules, accessUserModules,createSubModule,getSubModuleList,
     updateSubModule,updateModule,assignSubModule,updateUserModule, sideBar} = require('../controller/module/moduleController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createmodule', authenticateToken, createmodule);
router.post('/updateModule', authenticateToken, updateModule);
router.post('/getAllModules', authenticateToken, getAllModules);
router.post('/accessUserModules', authenticateToken, accessUserModules);
router.post('/createSubModule', authenticateToken, createSubModule);
router.post('/getSubModuleList', authenticateToken, getSubModuleList);
router.post('/updateSubModule', authenticateToken, updateSubModule);
router.post('/assignSubModule', authenticateToken, assignSubModule);
router.post('/updateUserModule', authenticateToken, updateUserModule);
router.post('/sideBar', authenticateToken, sideBar);




module.exports = router;
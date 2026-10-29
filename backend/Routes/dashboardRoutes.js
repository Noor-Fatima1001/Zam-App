const express = require('express');
const {
   dailySales

} = require('../controller/dashboard/dashboardController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/dailySales', authenticateToken, dailySales);


module.exports = router;
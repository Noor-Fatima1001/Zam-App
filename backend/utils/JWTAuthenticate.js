const jwt = require('jsonwebtoken');
const secretKey = 'mySuperSecretKey123!';
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Authorization Header:", authHeader);

    // Check if the token has "Bearer" prefix or is standalone
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(' ')[1]
        : authHeader;

    console.log("Extracted Token:", token);

    if (!token) {
        return res.status(401).send({ success: false, message: 'Access Denied. No token provided.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send({ success: false, message: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aimeeting_secret_key';

module.exports = function (req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    // Check if not token
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const parts = authHeader.split(' ');
    const token = parts[1] || parts[0];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

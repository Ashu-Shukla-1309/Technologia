// server/auth-middleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Read from HTTP-only cookie first, then fallback to header
    const token = req.cookies?.token || (req.header('Authorization')?.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ error: "Access Denied. Please log in." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Contains { id, email, isAdmin, role }
        next();
    } catch (err) {
        // 🛡️ SECURITY FIX: Must be 401 so the frontend interceptor knows to refresh!
        res.status(401).json({ error: "Session expired. Refresh required." });
    }
};

const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }
    next();
};

const verifySellerOrAdmin = (req, res, next) => {
    if (!req.user || (!req.user.isAdmin && req.user.role !== 'seller')) {
        return res.status(403).json({ error: "Unauthorized. Seller or Admin privileges required." });
    }
    next();
};

const verifyCsrf = (req, res, next) => {
    // Safe HTTP methods (like reading data) don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies['csrfToken'];
    const headerToken = req.header('X-CSRF-Token');

    // If tokens are missing, or they don't match exactly, block the request
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: "CSRF Validation Failed. Request blocked." });
    }

    next();
};

module.exports = {
    authenticateToken,
    verifyAdmin,
    verifySellerOrAdmin,
    verifyCsrf
};
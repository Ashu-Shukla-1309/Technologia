const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Secure OTP Generation
const generateSecureOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Input Validation 
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password) => {
    // Minimum 12 characters, at least one uppercase letter, one lowercase letter, one number and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return passwordRegex.test(password);
};

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: "Too many requests from this IP, please try again later." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20,
    message: { error: "Security alert: Too many authentication attempts. Please try again later." }
});

// 🛡️ SECURITY FIX: Prevent OTP Brute-Forcing
const otpVerificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Maximum 5 guesses before locking them out
    message: { error: "Too many failed attempts. Please request a new code." },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: "Too many password reset attempts. Please try again later." }
});

// Setup Security Middleware
const applySecurityMiddleware = (app) => {
    app.set('trust proxy', 1);

    // Dynamic CORS
    const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [];
    const corsOptions = {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    };
    app.use(require('cors')(corsOptions));

    // Security Headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    // 🛡️ Combined NoSQL Injection & XSS In-Place Sanitizer (Express 5 Compatible)
    app.use((req, res, next) => {
        const sanitizeInPlace = (obj) => {
            if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    // 1. Prevent NoSQL Injection
                    if (key.startsWith('$') || key.includes('.')) {
                        delete obj[key];
                    } 
                    // 2. Prevent XSS by escaping HTML characters in strings
                    else if (typeof obj[key] === 'string') {
                        obj[key] = obj[key].replace(/[&<>"']/g, (match) => {
                            const escapeMap = {
                                '&': '&amp;',
                                '<': '&lt;',
                                '>': '&gt;',
                                '"': '&quot;',
                                "'": '&#x27;'
                            };
                            return escapeMap[match];
                        });
                    } 
                    // Recursively check nested arrays and objects
                    else {
                        sanitizeInPlace(obj[key]); 
                    }
                }
            }
        };

        if (req.body) sanitizeInPlace(req.body);
        if (req.params) sanitizeInPlace(req.params);
        if (req.query) sanitizeInPlace(req.query);
        next();
    });
    
    
    app.use('/api/', globalLimiter);
    app.use('/api/auth/', authLimiter);
    app.use('/api/auth/forgot-password', passwordResetLimiter);
};

module.exports = {
    generateSecureOTP,
    isValidEmail,
    isValidPassword,
    applySecurityMiddleware,
    otpVerificationLimiter
};
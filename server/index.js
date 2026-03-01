const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Import our new security modules
const { 
    generateSecureOTP, 
    isValidEmail, 
    isValidPassword, 
    applySecurityMiddleware,
    otpVerificationLimiter
} = require('./security');

const { 
    authenticateToken, 
    verifyAdmin, 
    verifySellerOrAdmin,
    verifyCsrf
} = require('./auth-middleware');

const app = express();

// 🛡️ SECURITY FIX: Comprehensive Audit Logging
// Create a logs directory if it doesn't exist
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
// Log all requests to the file in the standard Apache combined format
app.use(morgan('combined', { stream: accessLogStream }));

// 🛡️ Apply all security configs (CORS, Helmet, Rate Limiting, XSS, NoSQL Injection)
applySecurityMiddleware(app);

app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Required for reading HTTP-Only cookies

// 🛡️ SECURITY FIX: Apply CSRF protection globally to all routes
app.use(verifyCsrf);

// 🛡️ SECURITY FIX: Endpoint to provide the CSRF token to the legitimate frontend
app.get('/api/csrf-token', (req, res) => {
    let token = req.cookies['csrfToken'];
    
    if (!token) {
        token = crypto.randomBytes(32).toString('hex');
        res.cookie('csrfToken', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'none'
        });
    }
    
    res.json({ csrfToken: token });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Shielded DB Connected Successfully"))
  .catch(err => console.error("Database Connection Error:", err));

// ==========================================
// 🗄️ DATABASE SCHEMAS
// ==========================================

const reviewSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String, 
  price: Number, 
  image: String, 
  category: String,
  description: String,
  inStock: { type: Boolean, default: true },
  reviews: [reviewSchema], 
  rating: { type: Number, default: 0 }, 
  numReviews: { type: Number, default: 0 },
  sellerEmail: String 
}));

const orderSchema = new mongoose.Schema({
  email: String, 
  customerName: String, 
  phone: String, 
  address: String,
  items: Array, 
  total: Number, 
  date: { type: Date, default: Date.now },
  paymentMethod: String, 
  transactionId: String,
  status: { type: String, default: 'Processing' },
  cancelReason: String, 
  cancelDate: Date      
});

// Attach encryption before compiling the model
orderSchema.plugin(mongooseFieldEncryption, { 
    fields: ["phone", "address"], 
    secret: process.env.ENCRYPTION_KEY 
});
const Order = mongoose.model('Order', orderSchema);

// --- ENCRYPTED USER SCHEMA ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['customer', 'seller'], default: 'customer' },
  name: { type: String, default: "" },          
  phone: { type: String, default: "" },         
  address: { type: String, default: "" },       
  isVerifiedSeller: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
});

// Attach encryption before compiling the model
userSchema.plugin(mongooseFieldEncryption, { 
    fields: ["phone", "address", "name"], 
    secret: process.env.ENCRYPTION_KEY 
});
const User = mongoose.model('User', userSchema);
const Otp = mongoose.model('Otp', new mongoose.Schema({
  email: String,
  code: String,
  createdAt: { type: Date, expires: 300, default: Date.now } 
}));

// 🛡️ SECURITY FIX: Refresh Token Schema
const RefreshToken = mongoose.model('RefreshToken', new mongoose.Schema({
  token: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiryDate: Date,
}));

const sendEmail = async (mailOptions, logTitle) => {
  try {
    const senderEmail = process.env.EMAIL_USER;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "Technologia Support", email: senderEmail },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html
    }, {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
    console.log(`Success: API Email Sent for ${logTitle}`);
  } catch (err) {
    console.error(`Brevo API Error [${logTitle}]:`, err.message);
  }
};

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });
    if (!isValidPassword(password)) return res.status(400).json({ error: "Password must be at least 12 characters and include uppercase, lowercase, numbers, and special characters." });
    
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) return res.status(400).json({ error: "This email is already registered" });
      user.password = await bcrypt.hash(password, 12);
      user.role = role || 'customer'; 
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const isInitialAdmin = email === process.env.ADMIN_EMAIL;
      user = new User({ email, password: hashedPassword, role: role || 'customer', isAdmin: isInitialAdmin }); 
      await user.save();
    }

    const verificationCode = generateSecureOTP();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    await Otp.findOneAndUpdate({ email }, { code: hashedCode }, { upsert: true, returnDocument: 'after' });

    const mailOptions = {
      to: email,
      subject: "Technologia: Your Verification Code",
      html: `<h2>Welcome to Technologia!</h2><p>Your verification code is: <b style="font-size: 24px;">${verificationCode}</b></p>`
    };
    sendEmail(mailOptions, "USER REGISTRATION OTP");

    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Internal registration failure" });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.json({ message: "If your email is registered, a reset code has been sent." });

    const resetCode = generateSecureOTP();
    const hashedCode = await bcrypt.hash(resetCode, 10);
    await Otp.findOneAndUpdate({ email }, { code: hashedCode }, { upsert: true, returnDocument: 'after' });

    const mailOptions = {
      to: email,
      subject: "Technologia: Password Reset Request",
      html: `<h2>Password Reset</h2><p>Your password reset code is: <b style="font-size: 24px;">${resetCode}</b></p><p>This code expires in 5 minutes.</p>`
    };
    sendEmail(mailOptions, "PASSWORD RESET OTP");

    res.json({ message: "If your email is registered, a reset code has been sent." });
  } catch (err) {
    res.status(500).json({ error: "Failed to process password reset" });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email });
    
    if (!record) return res.status(400).json({ error: "Invalid or expired verification code" });
    
    const isMatch = await bcrypt.compare(otp, record.code);
    if (!isMatch) return res.status(400).json({ error: "Invalid or expired verification code" });
    
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ email }); 
    
    res.json({ message: "Account successfully verified" });
  } catch (err) {
    res.status(500).json({ error: "Verification process failed" });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!isValidPassword(newPassword)) return res.status(400).json({ error: "Password does not meet security requirements." });

    const record = await Otp.findOne({ email });
    if (!record) return res.status(400).json({ error: "Invalid or expired code" });

    const isMatch = await bcrypt.compare(otp, record.code);
    if (!isMatch) return res.status(400).json({ error: "Invalid or expired code" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findOneAndUpdate({ email }, { password: hashedPassword, failedLoginAttempts: 0, lockUntil: null });
    await Otp.deleteOne({ email });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" }); 
    
    // 🛡️ SELF-HEALING ADMIN FIX
    if (email === process.env.ADMIN_EMAIL && !user.isAdmin) {
        user.isAdmin = true;
        await user.save();
    }

    if (user.isBanned) return res.status(403).json({ error: "Your account has been banned by the Administrator." });

    if (user.lockUntil && user.lockUntil > Date.now()) {
        return res.status(403).json({ error: "Account temporarily locked due to multiple failed attempts. Try again later." });
    }

    if (!user.isVerified && !user.isAdmin) {
      return res.status(403).json({ error: "Please verify your email with the OTP first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) user.lockUntil = Date.now() + 15 * 60 * 1000; 
        await user.save();
        return res.status(400).json({ error: "Invalid email or password" });
    }
    
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // 🛡️ SECURITY FIX: 15-Minute Access Token
    const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // 🛡️ SECURITY FIX: 7-Day Refresh Token
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const refreshTokenDoc = new RefreshToken({
        token: refreshTokenString,
        user: user._id,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await refreshTokenDoc.save();
    
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, 
        sameSite: 'none',
        maxAge: 15 * 60 * 1000 
    });

    res.cookie('refreshToken', refreshTokenString, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none', 
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: '/api/auth/refresh' 
    });

    res.json({ email: user.email, isAdmin: user.isAdmin, role: user.role }); 
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 🛡️ SECURITY FIX: Refresh Token Endpoint
app.post('/api/auth/refresh', async (req, res) => {
    const requestToken = req.cookies.refreshToken;
    if (!requestToken) return res.status(401).json({ error: "Refresh Token is required!" });

    try {
        const refreshToken = await RefreshToken.findOne({ token: requestToken }).populate('user');
        if (!refreshToken) return res.status(403).json({ error: "Invalid refresh token" });

        if (refreshToken.expiryDate.getTime() < new Date().getTime()) {
            await RefreshToken.findByIdAndDelete(refreshToken._id);
            return res.status(403).json({ error: "Refresh token expired. Please log in again." });
        }

        const newAccessToken = jwt.sign({ id: refreshToken.user._id, email: refreshToken.user.email, isAdmin: refreshToken.user.isAdmin, role: refreshToken.user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('token', newAccessToken, { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none', 
            maxAge: 15 * 60 * 1000 
        });
        res.json({ message: "Token refreshed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
    }
    // 🛡️ Ensure exact matching attributes to clear cross-site cookies
    res.clearCookie('token', { sameSite: 'none', secure: true });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh', sameSite: 'none', secure: true });
    
    res.json({ message: "Logged out successfully" });
});

// ==========================================
// 🧑‍💻 USER PROFILE & ADMIN ROUTES 
// ==========================================

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Failed to fetch profile" }); }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body; 
    const updatedUser = await User.findByIdAndUpdate(req.user.id, { name, phone, address }, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (err) { res.status(500).json({ error: "Failed to update profile" }); }
});

app.get('/api/users/sellers', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-password');
    res.json(sellers);
  } catch (err) { res.status(500).json({ error: "Failed to fetch sellers" }); }
});

app.put('/api/users/:id/ban', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBanned = isBanned;
    await user.save();

    if (isBanned) {
      const mailOptions = {
        to: user.email,
        subject: "Technologia: Account Suspended",
        html: `
          <div style="font-family: Arial; padding: 20px; border: 1px solid #f87171; border-radius: 10px;">
            <h2 style="color: #dc2626;">Account Suspended</h2>
            <p>Your seller account on Technologia has been suspended by the administrator.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin-top: 15px;">
              <strong>Reason provided by Admin:</strong><br/><i>"${reason}"</i>
            </div>
          </div>
        `
      };
      sendEmail(mailOptions, "ACCOUNT BANNED");
    } else {
      const mailOptions = {
        to: user.email,
        subject: "Technologia: Account Restored",
        html: `<h2>Account Restored</h2><p>Your seller account has been successfully unbanned.</p>`
      };
      sendEmail(mailOptions, "ACCOUNT UNBANNED");
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Failed to update ban status" }); }
});

app.delete('/api/users/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Product.deleteMany({ sellerEmail: user.email });
    await User.findByIdAndDelete(req.params.id);

    const mailOptions = {
      to: user.email,
      subject: "Technologia: Account Terminated",
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #7f1d1d; border-radius: 10px;">
          <h2 style="color: #991b1b;">Account Terminated</h2>
          <p>Your seller account and all associated listings on Technologia have been permanently deleted.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin-top: 15px;">
            <strong>Reason:</strong><br/><i>"${reason}"</i>
          </div>
        </div>
      `
    };
    sendEmail(mailOptions, "ACCOUNT DELETED");
    res.json({ message: "Seller deleted successfully" });
  } catch (err) { res.status(500).json({ error: "Failed to delete seller" }); }
});

app.put('/api/users/:id/verify-seller', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { isVerifiedSeller } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isVerifiedSeller }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Failed to update seller status" }); }
});

// ==========================================
// 📦 PRODUCT ROUTES
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).lean();
    const sellers = await User.find({ role: 'seller' }).select('email name isVerifiedSeller').lean();
    const sellerMap = {};
    sellers.forEach(s => sellerMap[s.email] = s);

    const enrichedProducts = products.map(p => ({
      ...p,
      seller: p.sellerEmail ? sellerMap[p.sellerEmail] : null
    }));

    res.json(enrichedProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    
    if (product.sellerEmail) {
       const seller = await User.findOne({ email: product.sellerEmail }).select('name email phone isVerifiedSeller').lean();
       product.seller = seller;
    }
    
    res.json(product);
  } catch (err) { res.status(500).json({ error: "Failed to fetch product details" }); }
});

app.post('/api/products', authenticateToken, verifySellerOrAdmin, async (req, res) => {
    try {
        const newProduct = new Product({ ...req.body, sellerEmail: req.user.email }); 
        await newProduct.save();
        res.json(newProduct);
    } catch (err) { res.status(500).json({ error: "Failed to add product" }); }
});

app.put('/api/products/:id', authenticateToken, verifySellerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (!req.user.isAdmin && product.sellerEmail !== req.user.email) {
      return res.status(403).json({ error: "You can only edit your own products." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) { res.status(500).json({ error: "Failed to update product" }); }
});

app.delete('/api/products/:id', authenticateToken, verifySellerOrAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (!req.user.isAdmin && product.sellerEmail !== req.user.email) {
          return res.status(403).json({ error: "You can only delete your own products." });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product successfully removed" });
    } catch (err) { res.status(500).json({ error: "Removal failed" }); }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, userName } = req.body;
    const userEmail = req.user.email;
    const productId = req.params.id;

    // 🛡️ THE FINAL FIX: Search for the product by its '_id' inside the items array
    const hasBought = await Order.findOne({ 
      email: { $regex: new RegExp(`^${userEmail}$`, 'i') }, // Case-insensitive email
      status: "Delivered",
      "items": { 
        $elemMatch: { 
          // Checks for both String and ObjectId versions of the ID
          _id: { $in: [productId, new mongoose.Types.ObjectId(productId)] } 
        } 
      }
    });

    if (!hasBought && !req.user.isAdmin) {
      return res.status(403).json({ 
        error: "You can only review items that have been delivered to your account." 
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.reviews.find(r => r.userEmail === userEmail)) return res.status(400).json({ error: "Already reviewed." });

    product.reviews.push({ userName, userEmail, rating: Number(rating), comment });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save(); 
    res.status(201).json({ message: "Review added" });
  } catch (err) { res.status(500).json({ error: "Review failed" }); }
});

// ==========================================
// 🛒 ORDER ROUTES
// ==========================================

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { customerName, phone, address, items, paymentMethod, transactionId } = req.body;
    
    const secureItems = [];
    let secureTotalPaise = 0; // 🛡️ SECURITY FIX: Integer math for money

    for (let item of items) {
      const product = await Product.findById(item._id);
      if (product) {
        const qty = item.quantity || 1;
        
        // Convert to integers (paise/cents) to prevent floating-point errors
        const priceInPaise = Math.round(product.price * 100);
        secureTotalPaise += priceInPaise * qty;

        secureItems.push({ productId: product._id, name: product.name, price: product.price, quantity: qty, image: product.image });
      }
    }
    
    // Convert back to standard currency format
    const secureTotal = secureTotalPaise / 100;

    const newOrder = new Order({ email: req.user.email, customerName, phone, address, items: secureItems, total: secureTotal, paymentMethod, transactionId });
    await newOrder.save();
    res.json(newOrder);
  } catch (err) { res.status(500).json({ error: "Failed to process order" }); }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { email: req.user.email };
    res.json(await Order.find(filter).sort({ date: -1 }));
  } catch (err) { res.status(500).json({ error: "Failed to fetch orders" }); }
});

app.put('/api/orders/:id/status', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(updatedOrder);
  } catch (err) { res.status(500).json({ error: "Failed to update status" }); }
});

app.post('/api/orders/:id/return', authenticateToken, async (req, res) => {
  try {
    const { type, reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== req.user.email && !req.user.isAdmin) return res.status(403).json({ error: "Unauthorized" });

    order.status = `Return Requested (${type})`;
    await order.save();
    res.json({ message: "Return request sent successfully", order });
  } catch (err) { res.status(500).json({ error: "Failed to process return request" }); }
});

app.post('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) return res.status(404).json({ error: "Order record not found" });
        if (order.status === "Cancelled") return res.status(400).json({ error: "Order is already cancelled" });
        if (order.email !== req.user.email && !req.user.isAdmin) return res.status(403).json({ error: "Unauthorized" });

        order.status = "Cancelled";
        order.cancelReason = reason;
        order.cancelDate = new Date();
        await order.save();
        res.json({ message: "Order successfully cancelled", order });
    } catch (err) { res.status(500).json({ error: "Failed to cancel order" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fortress Server operating on port ${PORT}`));
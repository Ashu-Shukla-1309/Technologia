require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();

app.set('trust proxy', 1);
app.use(helmet()); 

app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'https://technologia-ibm.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean), 
  credentials: true 
}));

app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (/^\$/.test(key) || /\./.test(key)) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: { error: "Security alert: Too many attempts. Please try again later." }
});

// ==========================================
// 🛡️ SECURITY MIDDLEWARE (NEW)
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: "Access Denied. Please log in." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Contains { id, email, isAdmin }
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
  }
  next();
};

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
  numReviews: { type: Number, default: 0 }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
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
}));

const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }
}));

const Otp = mongoose.model('Otp', new mongoose.Schema({
  email: String,
  code: String,
  createdAt: { type: Date, expires: 300, default: Date.now } 
}));

const sendEmail = async (mailOptions, logTitle) => {
  try {
    const senderEmail = process.env.EMAIL_USER;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { 
        name: "Technologia Support", 
        email: senderEmail 
      },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Success: API Email Sent for ${logTitle}`);
  } catch (err) {
    console.error(`Brevo API Error [${logTitle}]:`, err.response?.data || err.message);
    console.log(`\nEmail Log Fallback: ${logTitle}`);
    console.log(`Recipient: ${mailOptions.to}\nSubject: ${mailOptions.subject}\n---`);
    console.log(mailOptions.html.replace(/<[^>]*>?/gm, '')); 
    console.log(`-----------------------------------------\n`);
  }
};

app.use('/api/auth/', authLimiter);

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) return res.status(400).json({ error: "This email is already registered" });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({ email, password: hashedPassword });
      await user.save();
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { code: verificationCode }, { upsert: true, returnDocument: 'after' });

    const mailOptions = {
      to: email,
      subject: "Technologia: Your Verification Code",
      html: `<h2>Welcome to Technologia!</h2><p>Your verification code is: <b style="font-size: 24px;">${verificationCode}</b></p>`
    };
    
    sendEmail(mailOptions, "USER REGISTRATION OTP");

    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Internal registration failure" });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { code: resetCode }, { upsert: true, returnDocument: 'after' });

    const mailOptions = {
      to: email,
      subject: "Technologia: Password Reset Request",
      html: `<h2>Password Reset</h2><p>Your password reset code is: <b style="font-size: 24px;">${resetCode}</b></p><p>This code expires in 5 minutes.</p>`
    };
    
    sendEmail(mailOptions, "PASSWORD RESET OTP");

    res.json({ message: "Reset code generated" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to process password reset" });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ error: "Invalid or expired verification code" });
    
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
    
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ error: "Invalid or expired code" });

    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteOne({ email });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    
    const isAdmin = email === process.env.ADMIN_EMAIL;

    if (!user.isVerified && !isAdmin) {
      return res.status(403).json({ error: "Please verify your email with the OTP first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    
    // 🛡️ SECURITY FIX: Added 'email' to the JWT Payload so backend knows exactly who is making requests
    const token = jwt.sign({ id: user._id, email: user.email, isAdmin }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, email: user.email, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});


// ==========================================
// 📦 PRODUCT ROUTES
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// 🛡️ SECURITY FIX: Only Admins can add/edit/delete
app.post('/api/products', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

app.put('/api/products/:id', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete('/api/products/:id', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product successfully removed" });
    } catch (err) {
        res.status(500).json({ error: "Removal failed" });
    }
});

// ==========================================
// ⭐ REVIEWS ROUTE (NEW)
// ==========================================
app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, userName } = req.body;
    const userEmail = req.user.email; // Extracted securely from JWT

    const hasBought = await Order.findOne({ email: userEmail, status: "Delivered", "items.productId": req.params.id });
    if (!hasBought && !req.user.isAdmin) return res.status(403).json({ error: "You can only review delivered items." });

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

// 🛡️ SECURITY FIX: Recalculates total price on server to prevent price hacking
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { customerName, phone, address, items, paymentMethod, transactionId } = req.body;
    
    let secureTotal = 0;
    const secureItems = [];

    // Verify prices from the database
    for (let item of items) {
      const product = await Product.findById(item._id);
      if (product) {
        const qty = item.quantity || 1;
        secureTotal += product.price * qty;
        secureItems.push({ 
          productId: product._id, 
          name: product.name, 
          price: product.price, 
          quantity: qty, 
          image: product.image 
        });
      }
    }

    const newOrder = new Order({ 
      email: req.user.email, // 🛡️ Pulled from token, not body
      customerName, 
      phone, 
      address, 
      items: secureItems, 
      total: secureTotal, 
      paymentMethod, 
      transactionId 
    });
    await newOrder.save();

    const formattedTotal = secureTotal.toLocaleString('en-IN');
    
    const itemsListHtml = secureItems.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">x${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>`
    ).join('');

    const mailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `New Sale: ₹${formattedTotal} | Order #${newOrder._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">TECHNOLOGIA</h1>
            <p style="color: #3b82f6; margin: 5px 0 0 0; font-weight: bold;">NEW ORDER RECEIVED</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Customer Details</h3>
            <p style="color: #475569; line-height: 1.6;">
              <strong>Name:</strong> ${customerName}<br>
              <strong>Email:</strong> ${req.user.email}<br>
              <strong>Phone:</strong> ${phone}<br>
              <strong>Delivery Address:</strong> ${address}
            </p>

            <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 30px;">Order Summary</h3>
            <p style="color: #475569; font-size: 14px;"><strong>Order ID:</strong> ${newOrder._id}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #475569; font-size: 14px;">
              <thead>
                <tr style="background-color: #f8fafc; text-align: left;">
                  <th style="padding: 10px;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
              <p style="margin: 0; color: #475569;"><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p style="margin: 5px 0 0 0; color: #475569;"><strong>Transaction ID:</strong> ${transactionId || 'N/A'}</p>
              <h2 style="margin: 15px 0 0 0; color: #0f172a; text-align: right;">Grand Total: ₹${formattedTotal}</h2>
            </div>
          </div>
        </div>
      `
    };
    
    sendEmail(mailOptions, "NEW ORDER NOTIFICATION");

    res.json(newOrder);
  } catch (err) {
    console.error("Order Creation Error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});

// 🛡️ SECURITY FIX: Removed unauthenticated data leak. Users only see their own orders now.
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { email: req.user.email };
    res.json(await Order.find(filter).sort({ date: -1 }));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 🛡️ SECURITY FIX: Prevents fake admin status updates
app.put('/api/orders/:id/status', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// 🛡️ SECURITY FIX: Ensures users can only return their own items
app.post('/api/orders/:id/return', authenticateToken, async (req, res) => {
  try {
    const { type, reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== req.user.email && !req.user.isAdmin) return res.status(403).json({ error: "Unauthorized" });

    order.status = `Return Requested (${type})`;
    await order.save();

    const formattedTotal = order.total.toLocaleString('en-IN');

    const mailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `Action Required: ${type} Request | Order #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f59e0b; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">TECHNOLOGIA</h1>
            <p style="color: #fffbeb; margin: 5px 0 0 0; font-weight: bold;">RETURN / REPLACE REQUEST</p>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569; line-height: 1.6;">
              <strong>Customer Email:</strong> ${req.user.email}<br>
              <strong>Order ID:</strong> ${order._id}<br>
              <strong>Request Type:</strong> <span style="color: #d97706; font-weight: bold;">${type}</span><br>
              <strong>Total Value:</strong> ₹${formattedTotal}
            </p>
            <div style="margin-top: 20px; padding: 20px; border-left: 4px solid #f59e0b; background-color: #fffbeb;">
              <h3 style="margin-top: 0; color: #b45309;">Customer's Reason:</h3>
              <p style="margin: 0; color: #78350f; font-style: italic;">"${reason}"</p>
            </div>
            <p style="margin-top: 20px; color: #475569;">Please log in to the Admin Panel to update the order status and process this request.</p>
          </div>
        </div>
      `
    };
    
    sendEmail(mailOptions, "RETURN REQUEST NOTIFICATION");
    res.json({ message: "Return request sent successfully", order });
  } catch (err) {
    console.error("Return Request Error:", err);
    res.status(500).json({ error: "Failed to process return request" });
  }
});

// 🛡️ SECURITY FIX: Ensures users can only cancel their own items
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

        const formattedTotal = order.total.toLocaleString('en-IN');
        const formattedDate = order.cancelDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        
        const mailOptions = {
          to: process.env.ADMIN_EMAIL,
          subject: `Alert: Order Cancelled by User | ₹${formattedTotal}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">TECHNOLOGIA</h1>
                <p style="color: #fca5a5; margin: 5px 0 0 0; font-weight: bold;">USER CANCELLED ORDER</p>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #7f1d1d; margin-top: 0;">Cancellation Details</h2>
                <p style="color: #475569; line-height: 1.6;">A customer has just cancelled their order. Please review the details below to process any necessary refunds.</p>
                
                <div style="margin-top: 20px; padding: 20px; border-left: 4px solid #ef4444; background-color: #fef2f2; color: #991b1b; line-height: 1.8;">
                  <strong>Order ID:</strong> ${order._id}<br>
                  <strong>Customer Name:</strong> ${order.customerName || 'N/A'}<br>
                  <strong>Customer Email:</strong> ${order.email}<br>
                  <strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">Cancelled</span><br>
                  <strong>Date of Cancellation:</strong> ${formattedDate}<br>
                  <strong>Reason:</strong> <span style="font-style: italic;">"${reason}"</span>
                </div>

                <div style="margin-top: 25px; border-top: 2px solid #fee2e2; padding-top: 15px;">
                  <p style="margin: 0 0 5px 0; color: #475569;"><strong>Payment Method used:</strong> ${order.paymentMethod}</p>
                  <p style="margin: 0; color: #475569;"><strong>Transaction ID:</strong> ${order.transactionId || 'N/A'}</p>
                  <h2 style="margin-top: 15px; color: #ef4444; text-align: right;">Refund Due: ₹${formattedTotal}</h2>
                </div>
              </div>
            </div>
          `
        };
        
        sendEmail(mailOptions, "CANCELLATION ALERT");

        res.json({ message: "Order successfully cancelled", order });
    } catch (err) {
        console.error("Cancellation Error:", err);
        res.status(500).json({ error: "Failed to cancel order" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fortress Server operating on port ${PORT}`));
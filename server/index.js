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

// Trusting the proxy is necessary for rate limiting to work on Render's infrastructure
app.set('trust proxy', 1);

// Standard security middleware to protect the app from common web attacks
app.use(helmet()); 

// Configure CORS to allow our local development environment and our live Vercel frontend
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'https://technologia-ibm.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean), 
  credentials: true 
}));

// Limit the size of incoming JSON to prevent memory exhaustion attacks
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize inputs to remove any keys starting with '$' or containing '.' to prevent NoSQL injection
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

// Protect auth routes from brute force; 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: { error: "Security alert: Too many attempts. Please try again later." }
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Shielded DB Connected Successfully"))
  .catch(err => console.error("Database Connection Error:", err));

// Database Schemas
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String, price: Number, image: String, category: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  email: String, customerName: String, phone: String, address: String,
  items: Array, total: Number, date: { type: Date, default: Date.now },
  paymentMethod: String, transactionId: String
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

// API-based email sender using Brevo to bypass Render's SMTP blocks
const sendEmail = async (mailOptions, logTitle) => {
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      // Using a pre-verified Brevo sender for maximum deliverability
      sender: { name: "Technologia Support", email: "onboarding@brevo.com" },
      replyTo: { email: "irumaashutosh@gmail.com" },
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
    // Terminal fallback: ensures OTPs are still visible in Render logs for testing
    console.log(`\nEmail Log Fallback: ${logTitle}`);
    console.log(`Recipient: ${mailOptions.to}\nSubject: ${mailOptions.subject}\n---`);
    console.log(mailOptions.html.replace(/<[^>]*>?/gm, '')); 
    console.log(`-----------------------------------------\n`);
    console.error("Brevo API Error:", err.response?.data?.message || err.message);
  }
};

app.use('/api/auth/', authLimiter);

// Auth: Register new account
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (password.length < 6) return res.status(400).json({ error: "Password must be 6+ chars" });
    
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) return res.status(400).json({ error: "Email already exists" });
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
    await Otp.findOneAndUpdate({ email }, { code: verificationCode }, { upsert: true });

    const mailOptions = {
      to: email,
      subject: "Technologia: Your Verification Code",
      html: `<h2>Welcome to Technologia!</h2><p>Your verification code is: <b style="font-size: 24px;">${verificationCode}</b></p>`
    };
    
    // Floating promise: send email in background for faster UX
    sendEmail(mailOptions, "USER REGISTRATION OTP");

    res.json({ message: "Verification code sent" });
  } catch (err) {
    res.status(500).json({ error: "Registration process failed" });
  }
});

// Auth: Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { code: resetCode }, { upsert: true });

    const mailOptions = {
      to: email,
      subject: "Technologia: Password Reset Request",
      html: `<h2>Password Reset</h2><p>Your reset code is: <b style="font-size: 24px;">${resetCode}</b></p>`
    };
    
    sendEmail(mailOptions, "PASSWORD RESET OTP");
    res.json({ message: "Reset code generated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Auth: Verify OTP code
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ error: "Invalid or expired code" });
    
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ email }); 
    res.json({ message: "Account verified" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// Auth: Set new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ error: "Invalid code" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteOne({ email });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    
    const isAdmin = email === process.env.ADMIN_EMAIL;
    if (!user.isVerified && !isAdmin) {
      return res.status(403).json({ error: "Email verification required" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ id: user._id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, email: user.email, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Products: Get all
app.get('/api/products', async (req, res) => {
  res.json(await Product.find());
});

// Products: Add new
app.post('/api/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json(newProduct);
});

// Products: Delete
app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Item removed" });
});

// Orders: Place new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();

    const formattedTotal = req.body.total.toLocaleString('en-IN');
    const mailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `New Sale: ₹${formattedTotal} from ${req.body.customerName}`,
      html: `<h2>Order Notification</h2><p><b>Customer:</b> ${req.body.customerName}</p><p><b>Total:</b> ₹${formattedTotal}</p>`
    };
    
    sendEmail(mailOptions, "NEW ORDER NOTIFICATION");
    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Order processing failed" });
  }
});

// Orders: Get history
app.get('/api/orders', async (req, res) => {
  const { email } = req.query;
  const filter = email ? { email: email.toLowerCase() } : {};
  res.json(await Order.find(filter).sort({ date: -1 }));
});

// Orders: Cancel
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderToCancel = await Order.findById(req.params.id);
    if (!orderToCancel) return res.status(404).json({ error: "Order not found" });

    await Order.findByIdAndDelete(req.params.id);
    const formattedTotal = orderToCancel.total.toLocaleString('en-IN');
    
    const mailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `Order Cancelled: ₹${formattedTotal} by ${orderToCancel.email}`,
      html: `<h2>Cancellation Alert</h2><p><b>User:</b> ${orderToCancel.email}</p><p><b>Refund:</b> ₹${formattedTotal}</p>`
    };
    
    sendEmail(mailOptions, "CANCELLATION ALERT");
    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fortress Server operating on port ${PORT}`));
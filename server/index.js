require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

app.use(helmet()); 

// 🚀 DEPLOYMENT UPDATE 1: Dynamic CORS 
// It will use your live Vercel URL if available, otherwise defaults to localhost for testing.
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientUrl, credentials: true })); 

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
  message: { error: "Security alert: Too many attempts. Try later." }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Shielded DB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

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
  isVerified: { type: Boolean, default: false } // 👈 SECURITY LOCK
}));

const Otp = mongoose.model('Otp', new mongoose.Schema({
  email: String,
  code: String,
  createdAt: { type: Date, expires: 300, default: Date.now } 
}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.use('/api/auth/', authLimiter);

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (password.length < 6) return res.status(400).json({ error: "Password too short" });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { code: verificationCode }, { upsert: true, returnDocument: 'after' });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome! Your Verification Code",
      html: `<h2>Welcome to Technologia</h2><p>Your verification code is: <b>${verificationCode}</b></p>`
    });

    res.json({ message: "User registered successfully & code sent!" });
  } catch (err) {
    console.error("🚨 EMAIL/REGISTER CRASH:", err); // 👈 CRASH LOGGING
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { code: resetCode }, { upsert: true, returnDocument: 'after' });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `<h2>Password Reset</h2><p>Your password reset code is: <b style="font-size: 24px;">${resetCode}</b></p><p>This code expires in 5 minutes.</p>`
    });

    res.json({ message: "Reset code sent successfully!" });
  } catch (err) {
    console.error("🚨 EMAIL/FORGOT-PW CRASH:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = await Otp.findOne({ email, code: otp });
    if (!record) return res.status(400).json({ error: "Invalid or expired code" });
    
    // 👈 UNLOCK ACCOUNT
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ email }); 
    
    res.json({ message: "Account verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
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

    await User.findOneAndUpdate({ email }, { password: hashedPassword }, { returnDocument: 'after' });
    await Otp.deleteOne({ email });

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    
    // 👈 BLOCK UNVERIFIED USERS
    if (!user.isVerified) return res.status(403).json({ error: "Please verify your email with the OTP first!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });
    
    const isAdmin = email === process.env.ADMIN_EMAIL;
    const token = jwt.sign({ id: user._id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, email: user.email, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/products', async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json(newProduct);
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { email, customerName, phone, address, items, total, paymentMethod, transactionId } = req.body;
    const newOrder = new Order({ email, customerName, phone, address, items, total, paymentMethod, transactionId });
    await newOrder.save();

    const formattedTotal = total.toLocaleString('en-IN');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `💰 NEW SALE: ₹${formattedTotal} from ${customerName}`,
      html: `
        <h2>New Order Received!</h2>
        <p><b>Customer:</b> ${customerName} (${email})</p>
        <p><b>Total:</b> ₹${formattedTotal}</p>
        <p><b>Payment Method:</b> ${paymentMethod || 'N/A'}</p>
        <p><b>Transaction ID:</b> ${transactionId || 'N/A'}</p>
      `
    };

    transporter.sendMail(mailOptions, (err) => { if (err) console.log("🚨 EMAIL/ORDER CRASH:", err); });
    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Order failed" });
  }
});

app.get('/api/orders', async (req, res) => {
  const { email } = req.query;
  const filter = email ? { email: email.toLowerCase() } : {};
  res.json(await Order.find(filter).sort({ date: -1 }));
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderToCancel = await Order.findById(req.params.id);
        if (!orderToCancel) return res.status(404).json({ error: "Order not found" });

        await Order.findByIdAndDelete(req.params.id);

        const formattedTotal = orderToCancel.total.toLocaleString('en-IN');
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `🚨 ORDER CANCELLED: ₹${formattedTotal} by ${orderToCancel.email}`,
          html: `
            <h2 style="color: red;">Order Cancellation Notice</h2>
            <p><b>Customer Email:</b> ${orderToCancel.email}</p>
            <p><b>Customer Name:</b> ${orderToCancel.customerName || 'N/A'}</p>
            <p><b>Refund/Cancelled Amount:</b> ₹${formattedTotal}</p>
            <p><b>Order ID:</b> ${orderToCancel._id}</p>
          `
        };

        transporter.sendMail(mailOptions, (err) => { if (err) console.log("🚨 EMAIL/CANCEL CRASH:", err); });

        res.json({ message: "Order cancelled successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to cancel order" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Fortress Server active on port ${PORT}`));
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

// Trust the proxy to ensure rate limiting works correctly on cloud deployment
app.set('trust proxy', 1);

// Standard security headers to prevent common web vulnerabilities
app.use(helmet()); 

// Dynamic CORS configuration allowing local testing and the live Vercel frontend
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'https://technologia-ibm.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean), 
  credentials: true 
}));

// Limit body size to prevent large payload attacks
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom middleware to sanitize incoming data and prevent NoSQL injection attacks
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

// Protect authentication routes from brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: { error: "Security alert: Too many attempts. Please try again later." }
});

// Connect to MongoDB Atlas using the connection string in environment variables
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Shielded DB Connected Successfully"))
  .catch(err => console.error("Database Connection Error:", err));

// Schema definitions for products, orders, users, and OTP codes
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String, 
  price: Number, 
  image: String, 
  category: String
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
  status: { type: String, default: 'Processing' } 
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

// Primary function to send emails using Brevo REST API
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

// Handle new user registration and generate verification code
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

// Trigger password reset workflow
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

// Validate the OTP provided by the user
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

// Update password after OTP is successfully verified
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

// Standard login with JWT token generation
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
    
    const token = jwt.sign({ id: user._id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, email: user.email, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Inventory management routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
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
        res.json({ message: "Product successfully removed" });
    } catch (err) {
        res.status(500).json({ error: "Removal failed" });
    }
});

// Process new orders and send formatted HTML admin notifications
app.post('/api/orders', async (req, res) => {
  try {
    const { email, customerName, phone, address, items, total, paymentMethod, transactionId } = req.body;
    const newOrder = new Order({ email, customerName, phone, address, items, total, paymentMethod, transactionId });
    await newOrder.save();

    const formattedTotal = total.toLocaleString('en-IN');
    
    const itemsListHtml = items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">x${item.quantity || 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price}</td>
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
              <strong>Email:</strong> ${email}<br>
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

    console.log(`\nNew Transaction Logged`);
    console.log(`-------------------------`);
    console.log(`Customer: ${customerName}`);
    console.log(`Total:    ₹${formattedTotal}`);
    console.log(`Items:    ${items.length} units`);
    console.log(`-------------------------\n`);

    res.json(newOrder);
  } catch (err) {
    console.error("Order Creation Error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});

// Retrieve order history for a specific user
app.get('/api/orders', async (req, res) => {
  const { email } = req.query;
  const filter = email ? { email: email.toLowerCase() } : {};
  res.json(await Order.find(filter).sort({ date: -1 }));
});

// 🚀 NEW: Admin route to update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, adminEmail } = req.body;
    
    if (adminEmail !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

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

// Handle order cancellations and notify the admin with refund details
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order record not found" });

        await Order.findByIdAndDelete(req.params.id);

        const formattedTotal = order.total.toLocaleString('en-IN');
        
        const mailOptions = {
          to: process.env.ADMIN_EMAIL,
          subject: `Action Required: Cancellation Refund | ₹${formattedTotal}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">TECHNOLOGIA</h1>
                <p style="color: #fca5a5; margin: 5px 0 0 0; font-weight: bold;">CANCELLATION ALERT</p>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #7f1d1d;">Action Required: Refund Processing</h2>
                <p style="color: #475569; line-height: 1.6;">A customer has just cancelled their order. Please process the refund to their original payment method.</p>
                
                <div style="margin-top: 20px; padding: 20px; border-left: 4px solid #ef4444; background-color: #fef2f2;">
                  <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Order ID:</strong> ${order._id}</p>
                  <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Customer Email:</strong> ${order.email}</p>
                  <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Payment Method used:</strong> ${order.paymentMethod}</p>
                  <p style="margin: 0; color: #991b1b;"><strong>Transaction ID:</strong> ${order.transactionId || 'N/A'}</p>
                </div>

                <h2 style="margin-top: 30px; color: #ef4444; text-align: center;">Refund Amount: ₹${formattedTotal}</h2>
              </div>
            </div>
          `
        };
        
        sendEmail(mailOptions, "CANCELLATION ALERT");

        console.log(`\nOrder Cancelled`);
        console.log(`-------------------------`);
        console.log(`Customer: ${order.customerName || 'N/A'}`);
        console.log(`Refund:   ₹${formattedTotal}`);
        console.log(`-------------------------\n`);

        res.json({ message: "Order successfully cancelled" });
    } catch (err) {
        console.error("Cancellation Error:", err);
        res.status(500).json({ error: "Failed to cancel order" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fortress Server operating on port ${PORT}`));
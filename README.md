
# Technologia 🚀 | Premium Tech Gadgets E-Commerce

Technologia is a full-stack, Single Page Application (SPA) designed to deliver a seamless, high-end e-commerce experience for premium tech gadgets. Built with the MERN stack and highly optimized for performance using Vite, this project features secure OTP authentication, an animated interactive UI, dynamic cart management, and a robust admin inventory system.

---

## 📑 Table of Contents
- [Key Features](#key-features)
- [Security Implementations](#security)
- [Technology Stack](#tech-stack)
- [Design System & Typography](#design-system)
- [Page & Component Breakdown](#page-breakdown)
- [Local Setup & Comprehensive Installation](#setup)
  - [1. Prerequisites](#prerequisites)
  - [2. Installation](#installation)
  - [3. Backend Configuration (.env)](#backend-env)
  - [4. Frontend Configuration (.env)](#frontend-env)
  - [5. Running the Application](#running)
- [Deployment Architecture](#deployment)
- [Author](#author)

---

<a name="key-features"></a>
## 🌟 Key Features

* **Secure Authentication Flow:** Email-based OTP verification for account creation and password resets.
* **Dynamic Cart & Checkout:** Real-time cart calculations, quantity management, and a multi-address local storage book.
* **Animated UI/UX:** Smooth page transitions, success/cancellation modals, and interactive hover states powered by Framer Motion.
* **Visual Order Tracking:** A dynamic, step-by-step timeline tracking the shipment status of user orders.
* **Integrated Payment UI:** Simulated secure checkout with options for Card, Cash on Delivery, and dynamic UPI QR code generation linked via environment variables.
* **Admin Dashboard:** Full CRUD operations for managing the product inventory directly from the frontend (Protected Route).

<a name="security"></a>
## 🛡️ Security Implementations

Designed with production-grade security standards in mind:
* **Rate Limiting:** Protects authentication routes from brute-force attacks (`express-rate-limit`).
* **HTTP Headers:** Secures Express apps by setting various HTTP headers (`helmet`).
* **NoSQL Injection Prevention:** Custom recursive sanitization middleware cleanses `req.body`, `req.query`, and `req.params` of dangerous `$` or `.` MongoDB operators.
* **Password Hashing:** Uses `bcryptjs` with a salt round of 10 for secure credential storage.
* **Environment Protection:** API URLs, JWT Secrets, Database URIs, and Admin UPI details are strictly hidden behind `.env` configurations.

<a name="tech-stack"></a>
## 🛠️ Technology Stack

### Frontend Architecture
* **Core:** React.js (v18), built and bundled with Vite.
* **Routing:** React Router DOM (v6).
* **Styling:** Tailwind CSS.
* **Animations:** Framer Motion.

### Backend & Database (API)
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API architecture)
* **Database:** MongoDB (NoSQL document storage for Products, Users, and Orders)
* **Authentication:** JWT (JSON Web Tokens) & Nodemailer (for OTPs)

<a name="design-system"></a>
## 🎨 Design System & Typography

Technologia relies on a dark-mode-first aesthetic (`#050b14`, `#0f172a`, `#1e293b`) to make premium product imagery pop, accented with Neon Blue (`#3b82f6`). 

**Typography:**
* **Global Default (`font-sans`):** Native sans-serif UI font (e.g., San Francisco, Segoe UI) for maximum readability and zero-latency loading.
* **Monospace (`font-mono`):** Used strategically for raw data elements (Order IDs, User Emails) to provide a technical, "developer-focused" aesthetic.
* **Font Weights:** Heavy reliance on `font-black` (Weight 900) for hero headings to establish a strong visual hierarchy.

<a name="page-breakdown"></a>
## 🗺️ Page & Component Breakdown

1.  **Home Page (`/`)**: Features a video-background hero section and a mapped product grid with category filtering.
2.  **Navigation & Cart (`Navbar.jsx`)**: Sticky header with search functionality and an animated off-canvas sidebar for cart management.
3.  **Authentication Pages (`/login`, `/signup`, `/verify`)**: Centralized forms featuring a 6-digit OTP input mapped to a React `useRef` array for seamless auto-focusing.
4.  **Checkout Modal (`CheckoutModal.jsx`)**: A multi-step modal featuring local address saving, dynamic payment option rendering, and environment-variable-protected UPI QR generation.
5.  **Order Management (`/orders`)**: Displays past purchases with an `OrderTrackerModal` for an animated delivery timeline and order cancellation.
6.  **Admin Inventory (`/add`)**: A protected route allowing authorized users to manage MongoDB product inventory directly from the frontend.

---

<a name="setup"></a>
## 💻 Local Setup & Comprehensive Installation

Follow these steps to run the Technologia platform on your local machine.

<a name="prerequisites"></a>
### 1. Prerequisites
Ensure you have the following installed and set up:
* **Node.js** (v16 or higher)
* **Git**
* A **MongoDB Atlas** account (or local MongoDB server)
* A **Google/Gmail Account** (for sending OTP emails via Nodemailer)

<a name="installation"></a>
### 2. Installation
Clone the repository and install dependencies for both the frontend and backend.

# Clone the repo
git clone [https://github.com/Ashu-Shukla-1309/Technologia.git](https://github.com/Ashu-Shukla-1309/Technologia.git)
cd Technologia

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install

<a name="backend-env"></a>

### 3. Backend Configuration (`server/.env`)

Create a `.env` file inside the **`server`** folder. You will need to configure your database and email transporter here.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
ADMIN_EMAIL=your_email@gmail.com
CLIENT_URL=http://localhost:5173

```

**How to get these values:**

* **`MONGO_URI`**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a free cluster, click "Connect", choose "Connect your application", and copy the connection string. Replace `<password>` with your database user password.
* **`JWT_SECRET`**: You can generate a random string or just type a secure passphrase (e.g., `TechnologiaSuperSecretKey2026!`).
* **`EMAIL_USER`**: The Gmail address you want the platform to use to send OTPs.
* **`EMAIL_PASS`**: **Do not use your normal Gmail password.** You must generate an "App Password".
1. Go to your Google Account Management.
2. Navigate to "Security" and ensure **2-Step Verification** is turned ON.
3. Search for "App Passwords" in the security settings.
4. Create a new App Password (name it "Technologia"), copy the generated 16-character code, and paste it here without spaces.


* **`ADMIN_EMAIL`**: The email address that will automatically be granted Admin privileges (access to `/add` route) upon signup.

<a name="frontend-env"></a>

### 4. Frontend Configuration (`client/.env`)

Create a `.env` file inside the **`client`** folder. Vite requires the `VITE_` prefix to expose these securely to the React app.

```env
VITE_ADMIN_UPI=your_actual_upi_id@bank
VITE_ADMIN_NAME="Your Full Name"
VITE_API_URL=http://localhost:5000

```

**How to get these values:**

* **`VITE_ADMIN_UPI`**: Enter your actual UPI ID (e.g., Google Pay, PhonePe, Paytm). The frontend uses this to dynamically generate a scannable QR code during checkout for simulated secure payments.
* **`VITE_ADMIN_NAME`**: Your name, which will be displayed beneath the QR code to build trust with the user.

<a name="running"></a>

### 5. Running the Application

You need to run both the Node.js server and the Vite React app simultaneously. Open two separate terminal windows/tabs.

**Terminal 1 (Backend):**


cd server
npx node index.js or npx nodemon index.js
# You should see: "Server running on port 5000" and "MongoDB Connected"



**Terminal 2 (Frontend):**

cd client
npm run dev
# You should see: "VITE ready... Local: http://localhost:5173/"


Navigate to `http://localhost:5173/` in your browser to explore the platform!

---

<a name="deployment"></a>

## ☁️ Deployment Architecture

The application is fully configured for cloud deployment:

* **Frontend (Vercel):** The React/Vite client is optimized for Vercel. Ensure `VITE_API_URL` is updated to point to the live backend URL in Vercel's Environment Variables settings.
* **Backend (Render):** The Node/Express API is hosted as a Web Service on Render. The `CLIENT_URL` environment variable must be set to the live Vercel domain to configure CORS securely.
* **Database (MongoDB Atlas):** Network access configured to allow `0.0.0.0/0` for dynamic cloud IP routing.

---

<a name="author"></a>

### Author

**Ashutosh Shukla** BBDNIIT | Aspiring Software Engineer specializing in scalable Web Development, UI/UX, and AI integration.
[LinkedIn Profile](https://www.linkedin.com/in/ashutoshshukla1309/) | [GitHub Profile](https://github.com/Ashu-Shukla-1309)


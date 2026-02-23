# 🤖 TECHNOLOGIA | Next-Gen E-Commerce

![Technologia Banner](https://img.shields.io/badge/Status-Live-blue?style=for-the-badge) ![MERN Stack](https://img.shields.io/badge/Stack-MERN-success?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

> **A futuristic, full-stack e-commerce platform featuring 3D animations, secure payments, and a high-performance backend.**

---

## 🚀 Live Demo
**[View Live Site](https://technologia.vercel.app)** *(Replace with your actual Vercel link)*

---

## ✨ Key Features

### 🎨 **Frontend (Futuristic UI)**
- **Immersive Hero Section:** Video backgrounds with floating 3D elements and "Vortex" particle effects.
- **Animations:** Smooth page transitions and scroll reveals using **Framer Motion**.
- **Dynamic Text:** Auto-typing and rotating text effects.
- **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop via **Tailwind CSS**.
- **Shopping Cart:** Real-time state management for adding/removing items.

### 🛡️ **Backend (The Fortress)**
- **Secure Auth:** JWT (JSON Web Tokens) with Bcrypt password hashing.
- **Admin Dashboard:** Special access to Add/Delete products and view all sales.
- **Email Notifications:** Automated email alerts to Admin upon every new sale using **Nodemailer**.
- **Security:** Protected against XSS, NoSQL Injection, and Spam with **Helmet**, **Rate Limiting**, and **Sanitization**.

### 💾 **Database**
- **MongoDB Atlas:** Cloud-hosted database for scalable product and user management.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Security** | Helmet, Bcrypt, JWT, Express-Rate-Limit |
| **Tools** | Nodemailer, Axios, React Router |

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/Ashu-Shukla-1309/Technologia.git](https://github.com/Ashu-Shukla-1309/Technologia.git)
cd Technologia
2. Backend Setup
Bash
cd server
npm install
Create a .env file in the server folder:

Code snippet
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
ADMIN_EMAIL=your_email@gmail.com
Start the Server:

Bash
# Runs on localhost:5000
npx nodemon index.js
3. Frontend Setup
Open a new terminal and navigate to the client folder:

Bash
cd client
npm install
Start the React App:

Bash
# Runs on localhost:5173
npm run dev
🔐 API Endpoints
Method	Endpoint	Description
GET	/api/products	Fetch all products
POST	/api/products	Add new product (Admin only)
DELETE	/api/products/:id	Remove product (Admin only)
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login user
POST	/api/orders	Submit order & send email
📂 Folder Structure
Technologia/
├── client/             # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI (Navbar, Modal)
│   │   ├── pages/      # Full Pages (Home, Admin, Profile)
│   │   └── App.jsx     # Main Router
├── server/             # Node Backend
│   ├── index.js        # Server Entry & API Routes
│   └── .env            # Secrets (Ignored by Git)
└── .gitignore          # Security rules
🤝 Contributing
Contributions are welcome!

Fork the project.

Create your Feature Branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the Branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📝 License
Distributed under the MIT License. See LICENSE for more information.

👨‍💻 Developed by Ashutosh Shukla

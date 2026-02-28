
# 🛍️ Technologia | Premium Tech Gadgets E-Commerce

Welcome to **Technologia**! This is a complete, modern website (a "Single Page Application" or SPA) built for buying premium tech gadgets online. It’s designed to be super fast, highly secure, and look incredible.

We built this using the **MERN Stack** (MongoDB, Express, React, Node.js) and made it lightning-fast using a tool called **Vite**.

Check out the deployed website:- [https://technologia-ibm.vercel.app/](https://technologia-ibm.vercel.app/)

---

## 📑 Table of Contents

1. [What Can It Do? (Key Features)](https://www.google.com/search?q=%23-what-can-it-do-key-features)
2. [How Is It Kept Safe? (Security)](https://www.google.com/search?q=%23%EF%B8%8F-how-is-it-kept-safe-security)
3. [What is it Built With? (Tech Stack)](https://www.google.com/search?q=%23%EF%B8%8F-what-is-it-built-with-tech-stack)
4. [How Does it Look? (Design)](https://www.google.com/search?q=%23-how-does-it-look-design)
5. [Step-by-Step Setup Guide (For Beginners!)](https://www.google.com/search?q=%23-step-by-step-setup-guide-for-beginners)
* [Step 1: Things You Need First (Prerequisites)](https://www.google.com/search?q=%23step-1-things-you-need-first-prerequisites)
* [Step 2: Downloading the Code](https://www.google.com/search?q=%23step-2-downloading-the-code)
* [Step 3: Setting Up the "Brain" (Backend)](https://www.google.com/search?q=%23step-3-setting-up-the-brain-backend)
* [Step 4: Setting Up the "Face" (Frontend)](https://www.google.com/search?q=%23step-4-setting-up-the-face-frontend)
* [Step 5: Turning It On!](https://www.google.com/search?q=%23step-5-turning-it-on)


6. [Putting It on the Internet (Deployment)](https://www.google.com/search?q=%23%EF%B8%8F-putting-it-on-the-internet-deployment)
7. [Meet the Creator](https://www.google.com/search?q=%23meet-the-creator)

---

<a name="key-features"></a>

## 🌟 What Can It Do? (Key Features)

* **Multi-Vendor Marketplace:** Just like Amazon, anyone can sign up as a Customer OR a Seller! Sellers get their own special inventory dashboard where they can add, edit, or delete their own tech gadgets.
* **Strict Seller Rules:** To keep buyers safe, a seller *cannot* list any items until they fill out their Profile with their real Full Name, Phone Number, and Complete Address.
* **Seller Identity & Trust Badges:** When you look at a gadget, a cool "Seller Card" shows you exactly who is selling it. Admins can award trusted sellers a green "✅ Verified" badge (or a warning "⚠️ Unverified" badge for new ones). There are also Trust Badges for Secure Checkout, Fast Delivery, and Easy Returns!
* **Admin "God Mode":** The website owner has a powerful hidden dashboard. They can track all sales, verify sellers, or even **Ban and Delete** bad sellers. If a seller gets banned, the website automatically emails them the exact reason why!
* **Pop-Up Reviews:** E-commerce runs on trust! Customers can leave 1-5 star ratings and written reviews, but *only* if their order was actually "Delivered" (no fake reviews!). The review window pops up beautifully right over the screen without taking you to a new page.
* **Smart Shopping Cart:** As you add items, the cart updates instantly. It remembers what you put in it, calculates the total, and lets you quickly change quantities.
* **Super Secure Login:** Instead of just a password, we email you a special one-time code (OTP) to prove it's really you when you sign up or forget your password. We use **Brevo** to make sure these emails arrive instantly.
* **Easy Checkout & Order Tracking:** Pay by Card, Cash on Delivery, or scan a real, generated UPI QR Code. Once bought, you get a visual timeline showing if your order is Processing, Shipped, or Delivered.
* 🔍 **Google-Style Live Search & Filtering**: Find gadgets instantly with a real-time, animated dropdown search bar at the top of the page. You can also filter the homepage by categories or sort by price.
* 🔄 **Self-Serve Cancellations & Returns**: Users can cancel orders or request "Returns/Replacements" directly from their dashboard. The system automatically sends a beautifully formatted email alert to the Admin!

<a name="security"></a>

## 🛡️ How Is It Kept Safe? (Security)

We built this to be as secure as a real, professional store:

* **Inventory Protection:** Sellers can only edit or delete their *own* products. The server strictly checks their digital ID before letting them change anything, meaning they can never mess with another seller's items.
* **Instant Ban Lockouts:** If the Admin bans a seller, the system instantly blocks them from logging in, protecting the marketplace.
* **No Spammers Allowed (Rate Limiting):** If someone tries to guess a password too many times, the website temporarily blocks them to keep accounts safe.
* **Hidden Passwords (Hashing):** We never save your real password. We scramble it into a secret code using something called `bcryptjs`. Even if someone broke into the database, they couldn't read the passwords.
* **Secret Keys (.env):** All the sensitive stuff—like the keys to the database, the secret codes for logins, and the owner's payment details—are locked away in a hidden file called `.env`.
* **Digital ID Cards (JWT):** When you log in, the server gives you a temporary "digital ID card" (a JSON Web Token). You show this card to do things like view your orders, protecting your data.

<a name="tech-stack"></a>

## 🛠️ What is it Built With? (Tech Stack)

### The "Face" (Frontend - What you see and click)

* **React.js & Vite:** The building blocks that make the website fast and interactive.
* **Tailwind CSS:** The styling tool that makes everything look modern and perfectly spaced.
* **Framer Motion:** The magic behind all the smooth sliding and popping animations.

### The "Brain" (Backend - The hidden logic and data)

* **Node.js & Express.js:** The engine that handles requests (like "add this to cart" or "ban this user").
* **MongoDB:** The giant digital filing cabinet where we store all the users, gadgets, and orders securely.
* **Brevo API:** The super-fast mailman that delivers our OTP emails, ban notifications, and receipts.

<a name="design-system"></a>

## 🎨 How Does it Look? (Design)

Technologia is designed to look like a high-end tech brand.

* **Colors:** We use a sleek **Light Mode** so the colorful pictures of the gadgets really stand out.
* **Fonts:** We use clean, easy-to-read fonts for normal text, and special "computer code" style fonts for things like Order Numbers to give it a cool, techy feel.

---

<a name="setup"></a>

## 💻 Step-by-Step Setup Guide (For Beginners!)

Don't worry if you've never done this before. Just follow these steps exactly, and you'll have your own version of Technologia running on your computer!

<a name="prerequisites"></a>

### Step 1: Things You Need First (Prerequisites)

Before we start, you need to download three free tools onto your computer:

1. **Node.js:** This lets your computer understand the code. Go to [nodejs.org](https://www.google.com/search?q=https://nodejs.org/) and download the "LTS" version. Install it like a normal program.
2. **Git:** This helps you download the code. Go to [git-scm.com](https://www.google.com/search?q=https://git-scm.com/) and download/install it.
3. **A Code Editor:** You need a place to look at the code. **Visual Studio Code (VS Code)** is the best. Download it from [code.visualstudio.com](https://www.google.com/search?q=https://code.visualstudio.com/).

<a name="installation"></a>

### Step 2: Downloading the Code

1. Open your computer's "Terminal" (on Mac) or "Command Prompt" (on Windows).
2. Type this exact command and press Enter. This copies all the code from the internet to your computer:

```bash
git clone https://github.com/Ashu-Shukla-1309/Technologia.git

```

3. Now, tell your terminal to go inside the new folder you just downloaded:

```bash
cd Technologia

```

<a name="backend-env"></a>

### Step 3: Setting Up the "Brain" (Backend)

The "backend" needs some special keys to work.

1. In your terminal, go into the server folder:

```bash
cd server

```

2. Tell Node.js to download all the tools the server needs:

```bash
npm install

```

3. Now, open the whole `Technologia` folder in **VS Code**.
4. Look for the folder named `server`. Inside the `server` folder, create a brand new file and name it exactly: **`.env`** (don't forget the dot!).
5. Copy and paste this exact text into that new `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=MakeUpASuperSecretPasswordHere123!
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_email@gmail.com
ADMIN_EMAIL=your_email@gmail.com
CLIENT_URL=http://localhost:5173
EMAIL_PASS=your_app_password

```

**How to fill in the blanks:**

* **`MONGO_URI`**:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a "Free Cluster" (a database).
3. Click "Connect", choose "Drivers" (or "Connect your application").
4. Copy the long link they give you. It will look like `mongodb+srv://username:<password>@cluster...`
5. Paste that link into your `.env` file, and replace `<password>` with the password you made for your database user.


* **`JWT_SECRET`**: Just type any long, random mix of letters and numbers here. It's a secret code only your server knows.
* **`BREVO_API_KEY`**:
1. Go to [Brevo.com](https://www.google.com/search?q=https://www.brevo.com/) and create a free account.
2. Go to your account settings and find "SMTP & API".
3. Generate a new "API Key", copy it, and paste it here.


* **`EMAIL_USER` & `ADMIN_EMAIL**`: Put your real email address here.
* **`EMAIL_PASS`**:
1. Enable Two-Factor Authentication (2FA) on your Google Account.
2. Go to the App Passwords page at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Click Select app and choose Other. Enter a name (e.g., "Mail Client") and click Generate.
4. A 16-character app password will appear. Copy it and put it as EMAIL_PASS= that password.



<a name="frontend-env"></a>

### Step 4: Setting Up the "Face" (Frontend)

Now we do the same thing for the website part.

1. Go back to your terminal. If you are still in the `server` folder, type `cd ..` to go back, then go into the client folder:

```bash
cd client

```

2. Download the tools the website needs:

```bash
npm install

```

3. In **VS Code**, look for the folder named `client`. Inside the `client` folder, create a new file and name it exactly: **`.env`**.
4. Copy and paste this text into that new `.env` file:

```env
VITE_ADMIN_UPI=your_actual_upi_id@bank
VITE_ADMIN_NAME="Your Full Name"
VITE_API_URL=http://localhost:5000

```

**How to fill in the blanks:**

* **`VITE_ADMIN_UPI`**: Put your real UPI ID here (like from Google Pay or PhonePe). This is what generates the QR code when someone chooses to pay!
* **`VITE_ADMIN_NAME`**: Type your real name here.

<a name="running"></a>

### Step 5: Turning It On!

You are almost there! You need to start both the "Brain" and the "Face" at the same time. You will need **two** terminal windows open.

**Terminal Window 1 (Starting the Brain):**

1. Make sure you are inside the `server` folder.
2. Type:

```bash
npx node index.js

```

*(You should see a message saying "Fortress Server operating" and "Shielded DB Connected!")*

**Terminal Window 2 (Starting the Face):**

1. Make sure you are inside the `client` folder.
2. Type:

```bash
npm run dev

```

*(You should see a message giving you a local link, usually `http://localhost:5173/`)*

**Final Step:** Open your web browser (like Chrome or Safari) and go to **`http://localhost:5173/`**. You should see your very own Technologia store!

---

<a name="deployment"></a>

## ☁️ Putting It on the Internet (Deployment)

Right now, the website only lives on your computer. When you are ready to show it to the world, you can put it on the internet for free!

* **The Website (Vercel):** We use a service called Vercel to host the React frontend. It makes it super fast for anyone to load the site.
* **The Server (Render):** We use a service called Render to keep the Node.js backend running 24/7.
* *(Note: When you do this, you have to update the links in your `.env` files so the live website knows how to talk to the live server!)*

---

<a name="author"></a>

### Meet the Creator

**Ashutosh Shukla**
*Aspiring Software Engineer specializing in scalable Web Development, UI/UX, and AI integration. Currently studying at BBDNIIT.*

* [Connect with me on LinkedIn](https://www.linkedin.com/in/ashutoshshukla1309/)
* [Check out my other projects on GitHub](https://github.com/Ashu-Shukla-1309)



# 🕹️ WINGAMES.CLUB — Real Money Gaming Matchmaking Platform

Welcome to **WINGAMES.CLUB** — a real-money Ludo battle platform where users can deposit funds, find real opponents, submit proof, and win cash prizes. Built with high performance and user trust in mind, this web app is fully mobile-optimized, secure, and integrated with real payment and verification systems.

<img src="https://i.ibb.co/4wj0yBkw/Whats-App-Image-2025-07-04-at-20-56-29.jpg" alt="WinGames UI" width="400"/>



## ⚙️ Features

- 🧾 **KYC & Age Verification**
- 👤 **Google Authentication with Supabase**
- 💸 **Wallet System**: Deposit, Withdraw, View History
- 🎯 **Matchmaking with Redis + Socket.IO**
- 🎮 **Ludo Room Creation & Game Sharing**
- 📤 **Match Verification via Screenshot Upload**
- 💵 **Razorpay Integration for Fund Handling**
- 📈 **Transaction & Match History**
- 📲 **Referral System** (Earn 2% of your friend’s winnings)

## 📱 UI Sneak Peek

| Match Verification | Share Page | KYC Verification |
|--------------------|------------|------------------|
| <img src="https://i.ibb.co/Xk8jB4S6/Whats-App-Image-2025-07-04-at-20-56-32-1.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-32-1" width="400" />|<img src="https://i.ibb.co/Lz8NZygb/Whats-App-Image-2025-07-04-at-20-56-32.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-32"  width="400"/> | <img src="https://i.ibb.co/SD8Xf1N7/Whats-App-Image-2025-07-04-at-20-56-31-1.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-31-1"  width="400" /> |

| Referral System | Transactions | Battle System |
|-----------------|------------------------|---------------|
| <img src="https://i.ibb.co/9Ft8bbG/Whats-App-Image-2025-07-04-at-20-56-31.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-31"  width="400"/>|<img src="https://i.ibb.co/tMF8kbBv/Whats-App-Image-2025-07-04-at-20-56-30-2.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-30-2"  width="400"/> | <img src="https://i.ibb.co/QvPVSwxn/Whats-App-Image-2025-07-04-at-20-56-30.jpg" alt="Whats-App-Image-2025-07-04-at-20-56-30"  width="400"/>|

## 🛠️ Tech Stack

| Technology    | Role                               |
|---------------|------------------------------------|
| **React**     | Frontend UI                        |
| **Node.js** + **Express** | Backend API server             |
| **Supabase**  | Auth + PostgreSQL database         |
| **Razorpay**  | Payments (deposit & withdraw)      |
| **Socket.IO** | Real-time matchmaking              |
| **Redis**     | Queue system for battle pairing    |
| **Cloudinary**| Image storage for screenshot proof |

## 📂 Folder Structure

```
/client         # Frontend (React)
/server         # Backend (Express.js)
/screenshots    # UI screenshots for README
```

## 🔧 Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/Shlokmonster/WINGAMES.CLUB.git
cd WINGAMES.CLUB
```

### 2. Install Dependencies

- **Frontend**
  ```bash
  cd client
  npm install
  npm start
  ```

- **Backend**
  ```bash
  cd ../server
  npm install
  npm run dev
  ```

### 3. Set Environment Variables

Create `.env` files for both client and server:
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
REDIS_URL=
```

## 🧠 How It Works

1. User signs in using Google (Supabase).
2. Deposits funds to wallet (Razorpay).
3. Joins a matchmaking queue (Socket.IO + Redis).
4. Plays Ludo using shared room code.
5. Uploads screenshot to verify match outcome.
6. Admin reviews and credits winnings.

## 💰 Referral System

Users can earn **2% of their friends' winnings** when they join via referral link. The referral module includes easy share buttons for WhatsApp, Telegram, etc.

## 📊 Admin Panel (not shown)

- Approve/Reject KYC
- Review Match Results
- Control Matchmaking and Payouts
- Manual Fund Adjustment

## 📦 Future Plans

- 🧠 AI-based screenshot validation (anti-cheat)
- 🏆 Leaderboard & Seasonal Tournaments
- 🔔 Push Notifications

## 👨‍💻 Developed By

Made with ❤️ by [@Shlokmonster](https://github.com/Shlokmonster) for a private client project.

---

### ⚠️ Disclaimer

This project is for educational and freelance portfolio purposes. All payment flows were integrated under client license and jurisdictional rules. Ensure compliance with Indian gaming laws before reusing or deploying.

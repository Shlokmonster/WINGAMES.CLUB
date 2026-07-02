<div align="center">

# 🎲 WINGAMES.CLUB

### Real-Money Ludo Matchmaking Platform

*Deposit. Match. Play. Win.*

<img src="https://i.ibb.co/4wj0yBkw/Whats-App-Image-2025-07-04-at-20-56-29.jpg" alt="WinGames UI" width="420"/>

<br/>

![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Matchmaking-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)

</div>

---

## 📖 Overview

**WinGames.club** is a real-money Ludo battle platform where players deposit funds, get matched against real opponents, play, submit proof of the result, and get paid out on wins. It's built as a full-stack, mobile-optimized web app with a strong focus on **security, trust, and speed** — OTP-based auth, KYC/age verification, real-time matchmaking, and a wallet system all wired together end to end.

> Built as a private client project — a complete, production-style architecture from auth to payouts.

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🔐 | **KYC & Age Verification** | Identity checks before real-money play is unlocked |
| 📱 | **OTP Auth (Supabase)** | Passwordless phone-number sign-in |
| 💰 | **Wallet System** | Deposit, withdraw, and full transaction history |
| ⚡ | **Live Matchmaking** | Redis-backed queueing paired with Socket.IO for instant pairing |
| 🎮 | **Ludo Room Creation** | Shareable room codes to start a match with your opponent |
| 📸 | **Screenshot Match Verification** | Players submit proof of result for admin review |
| 💳 | **Razorpay Integration** | Deposits & withdrawals *(upcoming)* |
| 📊 | **Match & Transaction History** | Full audit trail for every game and payment |
| 🔗 | **Referral Program** | Earn 2% of your referred friends' winnings |

---

## 🖼️ UI Sneak Peek

<table align="center">
<tr>
  <td align="center"><b>Match Verification</b></td>
  <td align="center"><b>Share Page</b></td>
  <td align="center"><b>KYC Verification</b></td>
</tr>
<tr>
  <td><img src="https://i.ibb.co/Xk8jB4S6/Whats-App-Image-2025-07-04-at-20-56-32-1.jpg" width="260"/></td>
  <td><img src="https://i.ibb.co/Lz8NZygb/Whats-App-Image-2025-07-04-at-20-56-32.jpg" width="260"/></td>
  <td><img src="https://i.ibb.co/SD8Xf1N7/Whats-App-Image-2025-07-04-at-20-56-31-1.jpg" width="260"/></td>
</tr>
<tr>
  <td align="center"><b>Referral System</b></td>
  <td align="center"><b>Transactions</b></td>
  <td align="center"><b>Battle System</b></td>
</tr>
<tr>
  <td><img src="https://i.ibb.co/9Ft8bbG/Whats-App-Image-2025-07-04-at-20-56-31.jpg" width="260"/></td>
  <td><img src="https://i.ibb.co/tMF8kbBv/Whats-App-Image-2025-07-04-at-20-56-30-2.jpg" width="260"/></td>
  <td><img src="https://i.ibb.co/QvPVSwxn/Whats-App-Image-2025-07-04-at-20-56-30.jpg" width="260"/></td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React | User interface |
| **Backend** | Node.js + Express | REST API server |
| **Auth & DB** | Supabase | Phone OTP auth + PostgreSQL |
| **Payments** | Razorpay | Deposits & withdrawals |
| **Realtime** | Socket.IO | Live matchmaking events |
| **Queueing** | Redis | Battle pairing queue |
| **Media** | Cloudinary | Screenshot proof storage |

---

## 🧭 How It Works

```
 1. Sign in            →  Phone OTP via Supabase
 2. Deposit             →  Add funds to wallet (Razorpay)
 3. Join Queue          →  Matchmaking via Redis + Socket.IO
 4. Play                →  Ludo match using a shared room code
 5. Verify              →  Upload screenshot of the result
 6. Payout              →  Admin reviews & credits winnings
```

---

## 📂 Folder Structure

```
WINGAMES.CLUB/
├── client/         # React frontend
├── server/         # Express.js backend
└── screenshots/    # UI screenshots for README
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Shlokmonster/WINGAMES.CLUB.git
cd WINGAMES.CLUB
```

### 2. Install dependencies

**Frontend**
```bash
cd client
npm install
npm start
```

**Backend**
```bash
cd ../server
npm install
npm run dev
```

### 3. Configure environment variables

Create a `.env` file in both `client/` and `server/`:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
REDIS_URL=

# Upcoming feature
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
```

---

## 🧑‍💼 Admin Panel

*(not publicly shown)*

- ✅ Approve / reject KYC submissions
- 🏆 Review match results
- 🎯 Control matchmaking & payouts
- 💵 Manual fund adjustments

---

## 🔗 Referral System

Invite friends and earn **2% of their winnings** for every match they play. Built-in one-tap share buttons make it easy to send referral links via WhatsApp, Telegram, and more.

---

## 🗺️ Roadmap

- [ ] AI-based screenshot validation (anti-cheat)
- [ ] Leaderboards & seasonal tournaments
- [ ] Push notifications
- [ ] Full Razorpay payment go-live

---

## 👨‍💻 Developed By

Made with ❤️ by **[@Shlokmonster](https://github.com/Shlokmonster)** — built as a private client project.

---

## ⚠️ Disclaimer

This project was built for **educational and freelance portfolio purposes**. All payment flows were integrated under client license and jurisdictional rules. Ensure full compliance with applicable Indian gaming laws (which vary by state) before reusing or deploying this project.

</div>

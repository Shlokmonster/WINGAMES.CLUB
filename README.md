<div align="center">

# 👑 WINGAMES.CLUB

### **Premium Real-Money Ludo Matchmaking Platform**
*Deposit. Match. Play. Win. Redefined with security and speed.*

<br/>

<img src="https://i.ibb.co/4wj0yBkw/Whats-App-Image-2025-07-04-at-20-56-29.jpg" alt="WinGames UI" width="450" style="border-radius: 12px; border: 3px solid #D4AF37; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);"/>

<br/>
<br/>

[![React](https://img.shields.io/badge/React-Frontend-%23D4AF37?style=for-the-badge&logo=react&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-%23D4AF37?style=for-the-badge&logo=node.js&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-API-%23D4AF37?style=for-the-badge&logo=express&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-%23D4AF37?style=for-the-badge&logo=supabase&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://supabase.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-%23D4AF37?style=for-the-badge&logo=socket.io&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://socket.io)
[![Redis](https://img.shields.io/badge/Redis-Matchmaking-%23D4AF37?style=for-the-badge&logo=redis&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://redis.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-%23D4AF37?style=for-the-badge&logo=razorpay&logoColor=%23D4AF37&labelColor=%230A0A0A)](https://razorpay.com)

</div>

---

## 🔱 Overview

**WinGames.club** is an elite, mobile-first real-money Ludo battle arena. Players securely deposit funds, queue for real-time matchmaking against active opponents, engage in competitive matches, and verify results via secure screenshot uploads to receive payouts.

The application leverages a high-performance, production-ready backend framework designed around **trust, speed, and strict verification workflows**—featuring OTP authentication, comprehensive KYC verification, live matchmaking synchronization, and a full-featured wallet system.

> 🗲 **Client Project Showcase:** Fully architected system demonstrating end-to-end transaction integrity, authentication flows, and real-time state management.

---

## ⚜️ Features & Highlights

```
🔑 KYC & Verification  ──► Fully-validated age check and identity verification
📱 Passwordless Auth    ──► Swift Supabase Phone OTP-based authentication
💰 Secure Wallet        ──► Seamless deposits, withdrawals, and full ledger audits
⚡ Live Matchmaking     ──► Redis queues combined with Socket.IO for instant pairing
🎮 Game Room Management ──► Direct Room Code sharing for rapid game initiation
📸 Results Verification  ──► Screenshot evidence submission verified by platform admins
🔗 Referral Incentive   ──► Native viral loop giving users 2% of referred player wins
```

---

## 🖼️ UI Showcase

<table align="center" style="border: 2px solid #D4AF37; border-collapse: collapse; background-color: #0A0A0A;">
  <thead>
    <tr style="background-color: #1A1A1A; border-bottom: 2px solid #D4AF37;">
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">Match Verification</th>
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">Share & Invite</th>
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">KYC Verification</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/Xk8jB4S6/Whats-App-Image-2025-07-04-at-20-56-32-1.jpg" width="250" style="border-radius: 8px;"/></td>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/Lz8NZygb/Whats-App-Image-2025-07-04-at-20-56-32.jpg" width="250" style="border-radius: 8px;"/></td>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/SD8Xf1N7/Whats-App-Image-2025-07-04-at-20-56-31-1.jpg" width="250" style="border-radius: 8px;"/></td>
    </tr>
    <tr style="background-color: #1A1A1A; border-bottom: 2px solid #D4AF37;">
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">Referral Dashboard</th>
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">Transaction Ledger</th>
      <th align="center" style="padding: 10px; color: #D4AF37; font-weight: bold;">Battle Arena</th>
    </tr>
    <tr>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/9Ft8bbG/Whats-App-Image-2025-07-04-at-20-56-31.jpg" width="250" style="border-radius: 8px;"/></td>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/tMF8kbBv/Whats-App-Image-2025-07-04-at-20-56-30-2.jpg" width="250" style="border-radius: 8px;"/></td>
      <td align="center" style="padding: 8px; border: 1px solid #333;"><img src="https://i.ibb.co/QvPVSwxn/Whats-App-Image-2025-07-04-at-20-56-30.jpg" width="250" style="border-radius: 8px;"/></td>
    </tr>
  </tbody>
</table>

---

## 📐 System Architecture

Below is the conceptual data and event flow map of **WinGames.club**:

```mermaid
graph TD
    %% Custom Styling for Gold and Black Theme
    classDef client fill:#0A0A0A,stroke:#D4AF37,stroke-width:2px,color:#FFF;
    classDef server fill:#1A1A1A,stroke:#D4AF37,stroke-width:2px,color:#FFF;
    classDef storage fill:#262626,stroke:#8C7853,stroke-width:1px,color:#D4AF37;
    classDef external fill:#0D0D0D,stroke:#A1824A,stroke-width:1.5px,color:#FFF;

    subgraph ClientSpace ["User Client Interface"]
        C[React SPA Client]:::client
    end

    subgraph BackendSpace ["Application Backend Core"]
        S[Node.js + Express API Server]:::server
        WS[Socket.IO Realtime Engine]:::server
        R[(Redis Matchmaking Queue)]:::storage
    end

    subgraph DataSpace ["Data & Platform Services"]
        DB[(Supabase PostgreSQL)]:::storage
        Auth[Supabase Auth Service]:::external
        Cloud[Cloudinary CDN]:::external
        Pay[Razorpay Payment API]:::external
    end

    %% Interactions
    C <-->|HTTP / WebSockets| WS
    C -->|REST Requests| S
    C -->|OTP Verification| Auth
    
    S <-->|Read / Write Queues| R
    S <-->|Data Persistence & Schema| DB
    S -->|Upload Proof| Cloud
    S -->|Initiate Payouts / Deposits| Pay
    
    WS <-->|Synchronize State| S

    %% Flow Indicators
    style ClientSpace fill:none,stroke:#D4AF37,stroke-dasharray: 5 5;
    style BackendSpace fill:none,stroke:#D4AF37,stroke-dasharray: 5 5;
    style DataSpace fill:none,stroke:#D4AF37,stroke-dasharray: 5 5;
```

---

## ⚙️ Tech Stack & Roles

| Service | Category | Functionality |
| :--- | :--- | :--- |
| **React** | Frontend | Highly responsive UI, optimized for mobile WebViews |
| **Node.js / Express** | Backend | Core RESTful API routing, business logic, validation |
| **Supabase** | DB & Identity | PostgreSQL schema enforcement & Secure Passwordless Phone Auth |
| **Socket.IO** | Realtime | Synchronous event loops for multiplayer game setup |
| **Redis** | Queue Management | Matchmaking queue memory broker ensuring quick pairing |
| **Cloudinary** | Media | Dynamic image storage for game results verification |
| **Razorpay** | Transactions | Secured payment gateway integration for user wallets |

---

## 🔄 Core User Flow

```
[Phone Auth] ➔ [Deposit Funds] ➔ [Join Redis Queue] ➔ [Get Room Code] ➔ [Play Match] ➔ [Upload Proof] ➔ [Receive Payout]
```

1. **Verify Identity:** Authenticate instantly with Phone OTP and complete KYC.
2. **Fund Wallet:** Load balance via secure Razorpay checkout gateway.
3. **Queue Up:** Enter matchmaking queue; Redis matches you with opponents of similar stakes.
4. **Acquire Room:** Socket.IO pushes a shared Room Code for the Ludo platform.
5. **Submit & Settle:** Snap and upload the winning screen. Admin panel clears validation to release the stakes.

---

## 📂 Project Structure

```
WINGAMES.CLUB/
├── client/           # Vite + React Frontend Application
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   └── index.css # Styling Definitions
├── server/           # Express Server & Socket.IO Matchmaker
└── complete_schema.sql  # Database Schema & Functions
```

---

## 🚀 Installation & Local Setup

### 1. Clone & Access Project
```bash
git clone https://github.com/Shlokmonster/WINGAMES.CLUB.git
cd WINGAMES.CLUB
```

### 2. Install Client Dependencies
```bash
npm install
npm run dev
```

### 3. Setup Backend Environment
Initialize environment parameters (`.env`) inside the root directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=your_redis_url
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_URL=your_cloudinary_url
```

---

## 👑 Developed By
Crafted with precision by **[@Shlokmonster](https://github.com/Shlokmonster)**. 

---

## ⚖️ Legal & Disclaimer
This repository is created exclusively for **portfolio and client presentation purposes**. All financial integrations rely on licensed client assets and sandboxed test environments. Verify and adhere to state-specific regulations on skill-based gaming in your region before using, adapting, or hosting this software.

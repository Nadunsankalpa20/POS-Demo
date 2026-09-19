# Supermarket POS + Back Office System

A modern, full-stack Supermarket POS (Point of Sale) & Back Office Management System with real-time Socket.IO synchronization, inventory tracking, role-based authentication, and dynamic analytics.

---

## ⚡ Quick Start (Local Development)

You can run all three services concurrently with a single command from the project root:

```bash
npm run dev
```

Or start them individually:

### 1. Backend API
```bash
cd Backend
npm run dev
```
> Starts on **http://localhost:5000** — auto-seeds database on first run

### 2. POS Cashier Application
```bash
cd POS
npm run dev
```
> Opens on **http://localhost:3000**

### 3. Back Office Application
```bash
cd BackOffice
npm run dev
```
> Opens on **http://localhost:3001**

---

## 🔑 Default Login Credentials

| Role    | Username  | Password    | Access Permissions               |
|---------|-----------|-------------|----------------------------------|
| Admin   | `admin`   | `admin123`  | Full system access (POS + BackOffice + User Management) |
| Manager | `manager` | `manager123`| Back Office operations (excluding user management) |
| Cashier | `cashier` | `cashier123`| POS terminal checkout & invoicing only |

---

## 🚀 Cloud Deployment Guide

```
┌─────────────────────────────────────────────────────────────┐
│                      GITHUB REPOSITORY                      │
│ (Monorepo: /Backend, /POS, /BackOffice, package.json, etc.) │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       VERCEL (Cloud)        │ │    RENDER / RAILWAY (Cloud) │
│  - Root Directory: POS      │ │  - Root Directory: Backend  │
│  - Vite + React             │ │  - Node.js + Express        │
│  - Env: VITE_API_URL        │ │  - Socket.IO Real-time      │
│  - Env: VITE_SOCKET_URL     │ │  - Env: MONGODB_URI (Atlas) │
└─────────────────────────────┘ └──────────────┬──────────────┘
                                               │
                                               ▼
                                ┌─────────────────────────────┐
                                │     MONGODB ATLAS (Cloud)   │
                                │  - Free M0 Database Cluster │
                                │  - Auto-seeds on 1st start  │
                                └─────────────────────────────┘
```

### Step 1: Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `supermarket-pos-system`).
2. Run the following commands in your project root:
   ```bash
   git add .
   git commit -m "Configure cloud hosting for Vercel, Render and GitHub"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

---

### Step 2: Set Up Free Cloud Database (MongoDB Atlas)

1. Sign up / log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 cluster** (select AWS / Frankfurt or closest region).
3. Under **Security > Database Access**, add a database user (e.g. username `pos_user`, password: `<your_password>`).
4. Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere (`0.0.0.0/0`)** so your cloud backend can connect.
5. Click **Connect > Drivers**, select Node.js, and copy your connection string:
   ```
   mongodb+srv://pos_user:<password>@cluster0.xxxx.mongodb.net/supermarket_pos?retryWrites=true&w=majority
   ```

---

### Step 3: Deploy Backend on Render (Always-On Cloud Server)

1. Sign up / log in to [Render.com](https://render.com).
2. Click **New + > Web Service** and connect your GitHub repository.
3. Configure the Web Service:
   - **Name**: `supermarket-pos-backend`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string from Step 2>`
   - `JWT_SECRET`: `<A random secret string, e.g. supermarket_jwt_secret_cloud_2026>`
   - `CLIENT_POS_URL`: `*`
   - `CLIENT_BACKOFFICE_URL`: `*`
5. Click **Create Web Service**.
6. When deployment finishes, copy your live backend URL (e.g., `https://supermarket-pos-backend.onrender.com`).

> **Note**: On the first start, the backend will automatically seed your MongoDB Atlas database with default products, categories, suppliers, and admin/cashier credentials!

---

### Step 4: Deploy POS Cashier Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New > Project** and import your GitHub repository.
3. In the project setup screen:
   - **Project Name**: `supermarket-pos-terminal`
   - **Framework Preset**: `Vite`
   - Click **Edit** next to **Root Directory** and select `POS`.
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://supermarket-pos-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://supermarket-pos-backend.onrender.com`
5. Click **Deploy**.
6. Your POS terminal is now live on Vercel (e.g. `https://supermarket-pos-terminal.vercel.app`)!

---

### Step 5: (Optional) Deploy Back Office on Vercel

If you also want the management dashboard hosted:
1. In Vercel, click **Add New > Project** and import the same repository again.
2. Select **Root Directory**: `BackOffice`.
3. Add the same Environment Variables:
   - `VITE_API_URL`: `https://supermarket-pos-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://supermarket-pos-backend.onrender.com`
4. Click **Deploy**.

---

## 🏛 Project Architecture

```
POS Full System/
├── Backend/                 Node.js + Express + TypeScript + Socket.IO + MongoDB
│   ├── src/
│   │   ├── models/          Mongoose schemas (Product, Sale, User, Stock...)
│   │   ├── routes/          REST API routes
│   │   ├── controllers/     Request handlers
│   │   ├── services/        Business logic layer
│   │   ├── config/          Database & Socket.IO server initialization
│   │   ├── middleware/      JWT authentication guard
│   │   └── utils/seed.ts    Database auto-seeder
│   └── tests/               Automated test suite
│
├── POS/                     Cashier Invoicing System (Vite + React + Tailwind)
│   ├── vercel.json          SPA rewrite rules for Vercel
│   └── src/
│       ├── pages/           LoginScreen, PosMenuScreen, PosMainScreen
│       ├── components/      Cart, ProductGrid, CheckoutModal, LoyaltyModal...
│       ├── store/           Zustand (authStore, cartStore, heldBillsStore)
│       └── services/        api.ts, socket.ts
│
├── BackOffice/              Manager & Admin Dashboard (Vite + React + Tailwind)
│   ├── vercel.json          SPA rewrite rules for Vercel
│   └── src/
│       ├── pages/           Dashboard, Products, Stock, Reports, Users, AuditLog
│       ├── components/      Sidebar, Header, Stock modals, Void modal
│       ├── store/           Zustand (authStore, liveStore)
│       └── services/        api.ts, socket.ts, exporter.ts
│
├── render.yaml              Render Web Service blueprint
└── package.json             Root orchestrator scripts
```

---

## 🛠 Technology Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB (Atlas / Mongoose), Socket.IO, JWT, bcrypt
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Lucide Icons, Canvas Confetti

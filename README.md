# Supermarket POS + Back Office System — Startup Guide

## Quick Start (3 terminals)

### Terminal 1 — Backend API
```bash
cd "POS Full System/Backend"
npm run dev
```
> Starts on **http://localhost:5000** — auto-seeds database on first run

### Terminal 2 — POS Application
```bash
cd "POS Full System/POS"
npm run dev
```
> Opens on **http://localhost:3000**

### Terminal 3 — Back Office Application
```bash
cd "POS Full System/BackOffice"
npm run dev
```
> Opens on **http://localhost:3001**

---

## Default Login Credentials

| Role    | Username  | Password    | Access               |
|---------|-----------|-------------|----------------------|
| Admin   | `admin`   | `admin123`  | Full system access   |
| Manager | `manager` | `manager123`| Back Office (no user management) |
| Cashier | `cashier` | `cashier123`| POS terminal only    |

---

## Architecture

```
POS Full System/
├── Backend/          Node.js + Express + MongoDB (embedded)
│   ├── src/
│   │   ├── models/   Mongoose schemas (Product, Sale, User, Stock...)
│   │   ├── routes/   REST API routes
│   │   ├── controllers/  Request handlers
│   │   ├── services/ Business logic layer
│   │   ├── middleware/  JWT auth guard
│   │   └── utils/seed.ts  Database seeder (26 products, 3 users)
│   └── tests/        Jest automated tests
│
├── POS/              Vite + React + TypeScript + Tailwind
│   └── src/
│       ├── pages/    LoginScreen, PosMainScreen
│       ├── components/ Cart, ProductGrid, CheckoutModal, ReceiptModal...
│       ├── store/    Zustand (authStore, cartStore, heldBillsStore)
│       └── services/ api.ts, socket.ts (real-time sync)
│
└── BackOffice/       Vite + React + TypeScript + Tailwind
    └── src/
        ├── pages/    Dashboard, Products, Stock, Reports, Users, AuditLog
        ├── components/ Sidebar, Header, Modals (StockIn, StockOut, Void)
        ├── store/    Zustand (authStore, liveStore)
        └── services/ api.ts, socket.ts, exporter.ts
```

## Features

### POS Terminal
- Dark/glassmorphic design with real-time barcode scanning
- Product catalog with search, category filters, and live stock
- Shopping cart with quantity adjustment and item discounts
- Checkout: Cash, Card, GCash payment methods
- Receipt generation and print
- Hold/Resume bills (multiple bills simultaneously)
- Sales history drawer
- Real-time stock sync via Socket.IO

### Back Office
- **Dashboard**: Revenue charts, category breakdown, real-time metrics
- **Products**: Full CRUD, barcode, pricing, stock levels, images
- **Stock Operations**: Stock In, Stock Out, Void Sales + movements table
- **Reports**: Revenue trends, product performance, stock report, CSV export
- **User Management**: Create/edit staff accounts with role-based access
- **Audit Trail**: Complete log of every system action, filterable

## Technology Stack
- **Backend**: Node.js, Express, TypeScript, MongoDB (embedded MongoMemoryServer), Socket.IO, JWT, bcrypt
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Lucide Icons

# BLK/OUT Streetwear - Nova Style

E-commerce store for streetwear built with **MedusaJS v2** backend and **React + Vite** storefront.

## 🏗️ Architecture

```
Nova-Style/
├── backend/          # MedusaJS v2 backend (API + Admin)
├── storefront/       # React + Vite + Tailwind frontend
├── docker-compose.yml
└── package.json      # Monorepo scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker (for PostgreSQL)
- npm or yarn

### 1. Start Database
```bash
npm run db:up
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Setup Environment
```bash
# Backend
cp backend/.env.example backend/.env

# Storefront
cp storefront/.env.example storefront/.env
```

### 4. Run Migrations & Seed Data
```bash
cd backend
npm run db:migrate
npm run seed
```

### 5. Start Development
```bash
# From root directory
npm run dev
```

This starts:
- **Backend**: http://localhost:9000 (API + Admin)
- **Storefront**: http://localhost:3000

## 📦 Products

8 streetwear products (4 women, 4 men):

**Women:**
- DRES KHAKI - 449 PLN
- SZARA BLUZA - 249 PLN
- DRES GRAFITOWY - 399 PLN
- TSHIRT CZARNY - 139 PLN

**Men:**
- DRES CZARNY - 449 PLN
- KURTKA JEANSOWA CZARNA - 329 PLN
- TSHIRT CZARNY - 149 PLN
- BLUZA KHAKI - 279 PLN

## 🛠️ Tech Stack

**Backend:**
- MedusaJS v2
- PostgreSQL
- Node.js

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- @medusajs/js-sdk
- TanStack Query

## 📁 Scripts

```bash
npm run dev           # Start both backend and storefront
npm run dev:backend   # Start backend only
npm run dev:storefront # Start storefront only
npm run build         # Build both
npm run db:up         # Start PostgreSQL
npm run db:down       # Stop PostgreSQL
npm run seed          # Seed products
```

## 💰 Why Self-hosted?

| | Shopify | Self-hosted (Medusa) |
|---|---------|---------------------|
| Subscription | $29-299/mo | $0 |
| Transaction fee | 0.5-2% | 0% |
| Payment gateway | +2.9% | ~1.4% (Stripe) |
| Hosting | Included | ~$10-30/mo |

**At $10k/mo revenue:** Shopify ~$229/mo vs Self-hosted ~$20/mo

## 📄 License

Private - All rights reserved

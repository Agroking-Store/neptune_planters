# Neptune Planters — Quotation & Inventory Management System

## Overview
Neptune Planters is a premium, full-stack enterprise web application tailored for managing custom planter inventories and generating elegant, high-quality quotation PDFs for clients. Designed with a sleek, modern, glassmorphism-inspired UI, this system provides administrators with the tools to seamlessly manage products, textures, pricing, and client quotes.

## Key Features

### 📦 Inventory Management
- **Complex Product Variants:** Add and manage products with intricate texture-based variants.
- **Advanced Media Handling:** A unique 3-image slot system for every product variant:
  - **Texture Swatch:** The material or finish pattern.
  - **Product Preview:** What the planter looks like in the selected texture.
  - **Reference Image:** Real-world contextual photos of the product.
- **Dynamic Pricing & Sizes:** Track multiple sizes, HSN numbers, and unit prices seamlessly.

### 📝 Quotation Engine
- **Intuitive Quote Builder:** Select clients, add products, select specific textures, set quantities, and apply line-item discounts.
- **Real-Time Calculations:** Automatic summarization of subtotals, tax/GST, discount amounts, and grand totals.
- **Status Tracking:** Track quotation lifecycles (Draft, Sent, Accepted, Rejected).

### 📄 Premium PDF Generation
- **Automated Puppeteer Rendering:** Converts HTML templates directly to beautifully formatted, print-ready PDFs.
- **Brand Identity:** High-fidelity custom designs featuring edge-to-edge colors, bespoke typography, automated QR code generation, and professional layouts without visual compromises.

### 📊 Dashboard & Analytics
- Track monthly sales, sold product value, and overall business metrics directly from the dashboard.

## Technology Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Routing:** TanStack Router (Type-safe routing)
- **Styling:** Tailwind CSS v4 + PostCSS
- **UI Components:** Radix UI (shadcn/ui inspired), Framer Motion for micro-animations
- **Form Management:** React Hook Form + Zod validation
- **State/Data Fetching:** TanStack React Query

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ORM)
- **Validation:** Zod schemas
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for secure password hashing
- **PDF Engine:** Puppeteer (Headless Chrome for HTML-to-PDF conversion)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Running locally or via MongoDB Atlas cluster)

### Environment Setup

1. **Server (`/server`)**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/neptune-planters
   JWT_SECRET=your_super_secret_key
   ```

2. **Client (`/client`)**
   Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Installation & Running

1. **Install dependencies:**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

2. **Start the Development Servers:**
   ```bash
   # Run the backend server (Terminal 1)
   cd server
   npm run dev

   # Run the frontend application (Terminal 2)
   cd client
   npm run dev
   ```

3. **Database Seeding (Optional):**
   ```bash
   # In the server directory, seed the initial database configuration
   npm run seed
   npm run seed:inventory
   ```

## Architecture Notes
- The application uses a strictly decoupled structure where the client and server act independently, communicating strictly via REST APIs.
- The PDF generation strategy circumvents the limitations of traditional PDF libraries (like `pdfkit` or `jspdf`) by rendering raw HTML/CSS strings into a headless Chromium browser instance (`puppeteer`), enabling modern CSS properties, custom web fonts, and dynamic styling logic.

# Velora WMS (Warehouse Management System)

A modern, high-performance Warehouse & Inventory Management System built with **Next.js 15**, **React**, **Lucide Icons**, and **Supabase (PostgreSQL)**.

---

## 🚀 Features

- **🔐 Authentication & Access Control**:
  - Secure Login & Registration with Supabase Authentication.
  - Role-based designations (*Warehouse Administrator*, *Warehouse Manager*, *Inventory Specialist*, *Procurement Officer*).
  - Persistent session management with remember me support.
  - User profile badge and secure sign-out in topbar & sidebar.
- **Dashboard Overview**: Real-time warehouse metrics, stock levels, valuation, and transaction activity.
- **Inventory Management**:
  - **Finished Products**: Finished goods tracking, SKU, batch numbers, warehouse rack locations, reorder alerts.
  - **Raw Materials**: Track fabrics, trims, accessories, quantity on hand, minimum thresholds.
  - **Stickers & Labels**: Dedicated inventory tracking for packaging stickers, barcode labels, and tags.
- **Audit & Transaction Ledger**: Complete history of Stock In, Stock Out, Adjustments, and Damaged items.
- **Suppliers Directory**: Supplier contact directory, lead times, and ratings.
- **Supabase Cloud Sync**: Real-time updates with PostgreSQL Row Level Security (RLS) policies.
- **Responsive & Modern UI**: Built with a sleek glassmorphic dark/light aesthetic, clean animations, and tabular views.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS / Modern CSS variables & glassmorphism
- **Database & Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📋 Database Setup

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy and run the SQL commands from [`supabase_schema.sql`](./supabase_schema.sql).
4. Ensure the tables (`finished_products`, `raw_materials`, `stickers`, `suppliers`, `inventory_transactions`) are created with Row Level Security (RLS) policies enabled.

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🏃 Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment

The app is ready for deployment on [Vercel](https://vercel.com/):

```bash
npx vercel
```

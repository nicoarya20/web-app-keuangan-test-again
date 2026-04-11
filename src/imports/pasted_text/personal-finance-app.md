# 💸 Personal Finance Web App – Prompt (Vibe Coding Mode)

## 🎯 Objective

Bangun sebuah **web application personal finance** yang modern, clean, dan powerful untuk membantu user mengelola:

* Pemasukan (income / salary)
* Pengeluaran (expenses)
* Wishlist (keinginan / target barang)
* Tabungan & investasi

Aplikasi harus terasa **simple tapi cerdas**, cocok untuk daily use, dan punya UX yang bikin user betah.

---

## 🧠 Core Concept

Aplikasi ini adalah **financial dashboard all-in-one** dengan pendekatan:

* Data-driven
* Visual-first (chart & summary)
* Fast interaction (no reload feel)

---

## 🧩 Main Features

### 1. 💰 Income Management

* Tambah pemasukan (gaji, freelance, passive income)
* Kategori income (salary, side hustle, bonus)
* Recurring income (bulanan)
* Statistik total income (monthly/yearly)

### 2. 💸 Expense Tracking

* Tambah pengeluaran
* Kategori (makan, transport, entertainment, dll)
* Tagging (optional)
* Daily / monthly breakdown
* Limit / budget per category

### 3. 🎯 Wishlist System

* Tambah item wishlist
* Harga target
* Prioritas (low, medium, high)
* Progress (manual atau auto dari tabungan)
* Reminder / motivation note

### 4. 🏦 Savings & Investment Tracker

* Tabungan manual
* Tracking investasi (crypto, saham, dll - optional simple version)
* Growth visualization
* Goal-based saving (misal: beli laptop 10jt)

### 5. 📊 Dashboard Overview

* Summary:

  * Total saldo
  * Total income vs expense
  * Saving rate
* Charts:

  * Pie chart (expenses category)
  * Line chart (cashflow)
* Quick insight:

  * "Kamu boros di kategori X bulan ini"

---

## 🎨 UI / UX Style

### Theme

* Modern dashboard
* Clean & minimal
* Soft shadow, rounded corners (2xl)

### Color Palette

* Primary: Indigo / Blue
* Success: Green
* Danger: Red
* Background:

  * Light: #F9FAFB
  * Dark: #0F172A

### Typography

* Headings: Bold
* Body: Clean sans-serif

### Layout

* Sidebar (navigation)
* Topbar (search, profile)
* Main content (cards + charts)

---

## 🧱 Tech Stack (Recommended)

### Frontend

* React / Next.js
* TailwindCSS
* Zustand / React Query

### Backend

* Node.js (Express / Hono)
* REST API or tRPC

### Database

* PostgreSQL + Prisma ORM

### Optional

* Auth: Clerk / JWT
* Charts: Recharts

---

## 🗂️ Data Model (Simple)

### User

* id
* name
* email

### Income

* id
* userId
* amount
* category
* date
* recurring

### Expense

* id
* userId
* amount
* category
* date
* note

### Wishlist

* id
* userId
* name
* targetPrice
* currentProgress
* priority

### Savings

* id
* userId
* amount
* goalName

---

## ⚡ Interaction & Behavior

* Real-time update (optimistic UI)
* Smooth transition (Framer Motion)
* Inline edit (no page reload)
* Toast notifications

---

## 🧠 Smart Features (Optional Advanced)

* AI insight:

  * "Pengeluaran kamu naik 20% dibanding bulan lalu"
* Auto categorization (basic rule-based)
* Monthly report summary

---

## 📱 Responsiveness

* Mobile-first
* Tablet optimized
* Desktop dashboard full

---

## 🚀 Output Expectation

Aplikasi harus:

* Cepat
* Intuitif
* Tidak ribet
* Bisa dipakai tiap hari

---

## 🧑‍💻 Vibe Coding Notes

* Fokus ke UX dulu, baru fitur kompleks
* Build incrementally (dashboard → income → expense → wishlist → savings)
* Jangan over-engineer di awal
* Keep it fun & iterative 🚀

---

## 🔥 Bonus Idea

* Mode "financial health score"
* Gamification (badge: hemat, rajin nabung, dll)

---

**End of Prompt**

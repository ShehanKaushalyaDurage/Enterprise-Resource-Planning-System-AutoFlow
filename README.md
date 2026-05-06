# 🚗 AutoFlow – Vehicle Service Center Management System

![Laravel](https://img.shields.io/badge/Laravel_11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**AutoFlow** is a comprehensive, full-stack Vehicle Service Center Management System (VSC-MS) designed to streamline workshop operations. Built with modern web technologies, it handles everything from vehicle registration and job card creation to inventory management, invoicing, and audit-logged role-based access control.

## ✨ Key Features

* **📝 Vehicle & Owner Management:** Two-step wizard for registering owners and vehicles with comprehensive service history timelines.
* **🛠️ Digital Service Cards:** Dynamic job cards with inspection notes, task assignment, and real-time stock deduction upon completion.
* **💰 Invoicing & Payments:** Itemized billing with partial payment support, tax calculations, and printable professional PDF invoices.
* **📦 Smart Inventory & GRN:** Real-time stock tracking, low-stock alerts, and Goods Received Note (GRN) processing.
* **💵 Petty Cash & Expense Ledger:** Daily petty cash sessions and unified expense tracking for accurate financial analytics.
* **🔐 Role-Based Access Control (RBAC):** Granular permissions for Admins, Managers, Receptionists, Technicians, and Cashiers.
* **🖨️ Print-Ready Reports:** PDF generation for Job Cards, Invoices, GRNs, and Monthly Financial Summaries via DomPDF.
* **📊 Analytics Dashboard:** Real-time KPI tracking, revenue vs. expense charts, and top-performing services.
* **🛡️ Security & Auditing:** Comprehensive Spatie Activity Logging for every CRUD operation, login, and print action.

## 🏗️ Technology Stack

### Backend
* **Framework:** Laravel 11 (PHP 8.3)
* **Database:** PostgreSQL 16
* **Authentication:** Laravel Sanctum (SPA Authentication)
* **Async Tasks:** Laravel Queue (Database Driver)
* **PDF Generation:** barryvdh/laravel-dompdf
* **Audit Trail:** Spatie Laravel Activity Log

### Frontend
* **Core:** React 18 (Vite)
* **Routing:** React Router v6
* **State Management:** TanStack Query (React Query) & Zustand
* **UI & Styling:** Tailwind CSS + ShadCN UI
* **Forms & Validation:** React Hook Form + Zod
* **Charts:** Recharts

### DevOps
* Docker & Docker Compose
* GitHub Actions (CI)
* ESLint + Prettier + PHP-CS-Fixer

## 🚀 Getting Started (Local Development)

The application is fully containerized for a seamless developer experience.

### Prerequisites
* Docker Desktop
* Node.js 20+ (for local frontend development if not using containerized UI)
* Git

Environment Setup:

Bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
Spin up the Docker Containers:

Bash
docker-compose up -d --build
Install Backend Dependencies & Setup Database:

Bash
docker-compose exec app composer install
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate --seed
docker-compose exec app php artisan storage:link
Access the Application:

Frontend: http://localhost:5173

Backend API: http://localhost:8000/api/v1

Telescope (Dev): http://localhost:8000/telescope


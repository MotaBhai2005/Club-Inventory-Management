# 📦 Club Inventory Management System

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

A comprehensive, full-stack web application designed for Robotics and Software clubs to efficiently manage their hardware components, project pipelines, inter-club lending, and member requests.

Built with a modern **glassmorphic design system**, it offers a visually stunning, highly responsive user interface backed by a robust, secure backend architecture.

---

## ✨ Key Features

- 🔐 **Role-Based Access Control (RBAC)**: Distinct workflows and permissions for **Admins**, **Inventory Managers**, and standard **Members**.
- 🗃️ **Inventory Tracking**: Manage components with detailed attributes (category, quantity, condition).
- 🤝 **Advanced Lending System**: Track items lent to other clubs or members. Automated cron jobs with email notifications for overdue items.
- 🚀 **Project & Bulk Order Management**: Plan projects, track status, manage associated bulk orders, and upload project imagery.
- 📝 **Member Request Pipeline**: Members can submit requests for new components, bulk orders, or project ideas. Managers can review, approve, or reject with notes.
- 🔔 **In-App Notifications**: Real-time alerts for request status updates, lending reminders, and system notifications.
- 📊 **Audit Logging**: Comprehensive tracking of all critical system actions for accountability.
- 🎨 **Premium UI/UX**: State-of-the-art glassmorphic aesthetics, floating labels, animated mesh backgrounds, and complete dark mode support.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom glassmorphic utility classes
- **Authentication**: [Next-Auth](https://next-auth.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Security**: JWT, Bcrypt
- **Utilities**: Multer (file uploads), Node-Cron (scheduled tasks), Nodemailer (email alerts), Zod (validation)

---

## 🎨 Design System

Our application features a deeply customized aesthetic tailored for a modern tech club:
- **Glassmorphism & Depth**: Extensive use of blurred, semi-transparent backgrounds to create a floating, multi-layered feel.
- **Dynamic Backgrounds**: Subtle, animated mesh gradients that provide a lively but professional ambiance.
- **Color Palette**: Centered around a cool, professional blue spectrum (`#185FA5`) with full automatic transitioning between light slate and deep dark modes (`#020617`).
- **Typography**: Inter for standard UI legibility and Noto Serif for artistic branding.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm, yarn, or pnpm

### 1. Clone the repository
```bash
git clone https://github.com/MotaBhai2005/Club-Inventory-Management.git
cd Club-Inventory-Management
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db"
DIRECT_URL="postgresql://user:password@localhost:5432/inventory_db"
JWT_SECRET="your_jwt_secret_here"
PORT=5000

# Email configurations for notifications
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

Initialize the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed     # Optional: Seed the database with initial roles and admin user
npm run dev      # Start the Express server
```

### 3. Frontend Setup
```bash
# In a new terminal, from the project root
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

Start the Next.js development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🏗️ Project Structure

```text
Club-Inventory-Management/
├── backend/                  # Express API Server
│   ├── prisma/               # Database schema and migrations
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # RBAC and auth middleware
│   │   ├── routes/           # API route definitions
│   │   └── server.ts         # Entry point
│   └── package.json
└── frontend/                 # Next.js Application
    ├── src/
    │   ├── app/              # Next.js App Router (pages)
    │   ├── components/       # Reusable UI components & modals
    │   ├── lib/              # Utilities and API clients
    │   ├── types/            # TypeScript definitions
    │   └── globals.css       # Global styles and Tailwind configs
    └── package.json
```

---

## 🤝 Contributing

Contributions are welcome! If you're a club member or an open-source enthusiast:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

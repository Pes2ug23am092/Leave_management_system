# Automated Leave Management System — LeaveItToUs (P12)

![Node.js](https://img.shields.io/badge/Node.js-%3E=_18-green)
![React](https://img.shields.io/badge/React-%3E=_19-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange)
![License](https://img.shields.io/badge/License-Educational-lightgrey)

**Project ID:** P12  
**Course:** UE23CS341A  
**Academic Year:** 2025  
**Semester:** 5th Sem  
**Campus:** RR  
**Branch:** AIML  
**Section:** B  
**Team:** LeaveItToUs

---

## 🔗 Quick Links
- 📘 [User Guide](Documentation/USER_GUIDE.md)
- 🧑‍💻 [Developer Guide](Documentation/DEVELOPER_GUIDE.md)
- 🧠 [API Documentation](Documentation/API_DOCUMENTATION.md)
- ✉️ [Email Setup](Documentation/EMAIL_SETUP.md)
- 🧪 [Test Plan](Documentation/ELMS_TEST_PLAN.md)

---

## 📋 Project Description

**LeaveItToUs** is a full-stack leave management system designed for applying, approving/rejecting, and cancelling employee leaves, with support for holiday data and **role-based access control** (Employee, Manager, Admin).  
It includes a **Node.js (Express)** backend with **MySQL** and a **React** frontend.

---

## 🧰 Tech Stack

| Layer | Technologies |
|--------|--------------|
| **Frontend** | React 19 (CRA), React Router DOM, Chart.js, Axios |
| **Backend** | Node.js (Express 5), MySQL (mysql2), JWT, bcrypt, Nodemailer, Helmet, CORS |
| **Testing** | Jest, Supertest |
| **Dev Tools** | Nodemon (dev), PM2 (prod), node-cron (background jobs) |

---

## 🧑‍💻 Development Team (LeaveItToUs)

- [@Deepthi-PES1UG23AM092](https://github.com/Deepthi-PES1UG23AM092) — Scrum Master  
- [@Pes1ug23am915](https://github.com/Pes1ug23am915) — Developer Team  
- [@pes1ug23am117](https://github.com/pes1ug23am117) — Developer Team  
- [@ChiragGD](https://github.com/ChiragGD) — Developer Team

### Teaching Assistants
- [@Amrutha-PES](https://github.com/Amrutha-PES)  
- [@VenomBlood1207](https://github.com/VenomBlood1207)

### Faculty Supervisor
- [@Arpitha035](https://github.com/Arpitha035)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+  
- MySQL Server 8.x (or MariaDB)

### Clone
```bash
git clone https://github.com/pestechnology/PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs.git
cd PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs
```

### Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Configure Backend

Create a `.env` file inside `backend/` (refer `Documentation/EMAIL_SETUP.md` for details):

```env
PORT=5000
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_USER=root
DB_PASS=your_db_password
DB_NAME=lms
DB_PORT=3306
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
EMAIL_MODE=ethereal
DEV_EMAIL_REDIRECT=
ADMIN_API_KEY=super_secret_admin_key
```

### Initialize Database

```bash
cd backend
node db/execute_sql.js
```

This executes SQL files from `backend/db/sql/` (schema + sample data).

### Run (Development)

```bash
# Backend (http://localhost:5000)
cd backend
npm run dev

# Frontend (http://localhost:3000)
cd ../frontend
npm start
```

---

## 📁 Project Structure

```
PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── services/
│   └── db/
│       ├── db.js
│       └── sql/
├── frontend/
├── Documentation/
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   ├── EMAIL_SETUP.md
│   ├── ELMS_TEST_PLAN.md
│   └── (assets/)
├── tests/
└── README.md
```

---

## 🛠️ Development Guidelines

### Branching Strategy

* `main` → Production-ready code
* `develop` → Active development branch
* `feature/*` → New feature branches
* `bugfix/*` → Fix-specific branches

### Commit Messages

Use **conventional commit** format:

* `feat:` — New features
* `fix:` — Bug fixes
* `docs:` — Documentation changes
* `style:` — Formatting/style
* `refactor:` — Refactoring
* `test:` — Testing-related changes

### Code Review Process

1. Create a feature branch from `develop`.
2. Commit and push changes.
3. Open a Pull Request to `develop`.
4. Request team review.
5. Merge after approval.

---

## 📚 Documentation

* 📘 [User Guide](Documentation/USER_GUIDE.md)
* 🧑‍💻 [Developer Guide](Documentation/DEVELOPER_GUIDE.md)
* 🧠 [API Documentation](Documentation/API_DOCUMENTATION.md)
* ✉️ [Email Setup](Documentation/EMAIL_SETUP.md)
* 🧪 [Test Plan](Documentation/ELMS_TEST_PLAN.md)

---

## 🧪 Testing

From the repository root:

```bash
npm run test:unit         # Run unit tests (Jest)
npm run test:integration  # Run integration tests (Supertest)
```

Tests are defined under `tests/` and configured via `jest.config.js`.
Ensure `backend/server.js` exports the Express `app` for integration tests.

---

## 🚢 Deployment Notes

* Use **PM2** or **Docker** for production deployment.
* Set `NODE_ENV=production` and disable Ethereal mode.
* Serve the frontend build via Nginx or static hosting.
* Proxy `/api` routes to the backend and enforce HTTPS.
* Rotate `JWT_SECRET` regularly.

**Example (PM2):**

```bash
pm2 start backend/server.js --name leaveit_backend
pm2 logs leaveit_backend
pm2 restart leaveit_backend
```

---

## 📄 License & Course Info

This project was developed for educational purposes as part of **PES University’s UE23CS341A course**.

**Course:** UE23CS341A  
**Institution:** PES University  
**Academic Year:** 2025  
**Semester:** 5th Sem  
**Campus:** RR  
**Branch:** AIML  
**Section:** B

---

⭐ **LeaveItToUs — Simplifying Leave Management for Organizations.**  
© 2025 LeaveItToUs Team. All rights reserved.

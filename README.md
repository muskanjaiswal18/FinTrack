![FinTrack logo](docs/screenshots/logo.png)

# FinTrack

A full-stack personal finance tracker built with the MERN stack. Track income and expenses, view a dashboard overview, and export your transaction history to Excel.

![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

**[Live Demo](https://fintrack-frontend-oewx.onrender.com)** · **[API Overview](#api-overview)** · **[Getting Started](#getting-started)**

---

## Preview

![FinTrack preview — Dashboard, Income overview, and Expenses](docs/screenshots/preview.png)

| | |
|---|---|
| **Dashboard** | Total balance, monthly income/expense, savings rate, income/spent/savings gauges, and a live "Recent Transactions" feed. |
| **Income overview** | Time-frame toggle (Daily/Weekly/Monthly/Yearly), a daily income trend chart, and the full income transaction list with inline edit/delete. |
| **Expenses** | Same layout as Income, scoped to spending — total/average expense, daily trend chart, and category tagging (e.g. Food). |

---

## Tech Stack

**Backend** — `fintrack-backend`
- Node.js + Express 5
- MongoDB + Mongoose (ODM)
- JWT-based authentication (`jsonwebtoken`)
- Password hashing with `bcryptjs`
- Input validation with `validator`
- Excel export with `xlsx`
- ES Modules (`"type": "module"`)

**Frontend** — `fintrack-frontend`
- React 19 + Vite 7
- Tailwind CSS v4
- React Router v7
- Recharts (charts/gauges)
- Framer Motion (animations)
- Axios (API calls)
- React Toastify (notifications)
- Lucide React (icons)

---

## Features

- **Auth** — signup/login with JWT, "remember me" toggle (localStorage vs sessionStorage), protected routes
- **Income & Expense tracking** — add, edit, delete transactions with description, amount, category, and date
- **Dashboard overview** — monthly income/expense/savings, savings rate, category breakdown, recent transactions
- **Time-frame filtering** — Daily / Weekly / Monthly / Yearly views with charts (hourly for daily, daily for monthly, monthly for yearly)
- **Excel export** — download income or expense history as `.xlsx` (server-generated, with a client-side fallback)
- **Profile management** — update name/email, change password

---

## Project Structure

### Backend
```
fintrack-backend/
├── server.js                # Express app entry point
├── config/
│   └── db.js                 # MongoDB connection (mongoose)
├── models/
│   ├── userModel.js
│   ├── incomeModel.js
│   └── expenseModel.js
├── controllers/
│   ├── userController.js     # register, login, profile, password
│   ├── incomeController.js   # CRUD + overview + Excel export
│   ├── expenseController.js  # CRUD + overview + Excel export
│   └── dashboardController.js
├── routes/
│   ├── userRoute.js
│   ├── incomeRoute.js
│   ├── expenseRoute.js
│   └── dashboardRoute.js
├── middleware/
│   └── auth.js                # JWT verification, sets req.user
└── utils/
    └── dateFilter.js          # daily/weekly/monthly/yearly range helper
```

### Frontend
```
fintrack-frontend/
├── index.html
├── src/
│   ├── main.jsx               # entry point (BrowserRouter)
│   ├── App.jsx                 # routing, auth state, protected routes
│   ├── config.js               # centralizes API_URL / API_BASE
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Income.jsx
│   │   ├── Expense.jsx
│   │   └── Profile.jsx
│   ├── components/
│   │   ├── Layout.jsx          # sidebar/navbar shell, fetches all transactions
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Add.jsx             # Add Transaction modal
│   │   ├── TransactionItem.jsx
│   │   ├── FinancialCard.jsx
│   │   ├── GaugeCard.jsx       # recharts RadialBarChart
│   │   ├── TimeFrame.jsx       # daily/weekly/monthly/yearly selector
│   │   └── Helpers.jsx         # date-range & chart-point utilities
│   ├── constants/
│   │   └── financeConstants.js # colors & category icons
│   ├── utils/
│   │   └── exportUtils.js      # client-side xlsx export fallback
│   └── assets/
│       └── dummyStyles.js      # shared Tailwind class strings
```

---

## Getting Started

### Backend
```bash
cd fintrack-backend
npm install
```

Create a `.env` file:
```
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

```bash
npm start        # runs via nodemon, http://localhost:4000
```

### Frontend
```bash
cd fintrack-frontend
npm install
```

Optionally create a `.env`:
```
VITE_API_URL=http://localhost:4000
```
(Defaults to a Render-hosted backend if not set — update `src/config.js` if needed.)

```bash
npm run dev       # http://localhost:5173
```

---

## API Overview

All protected routes require `Authorization: Bearer <token>`.

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/user/register` | POST | – | Create account |
| `/api/user/login` | POST | – | Log in |
| `/api/user/me` | GET | ✔ | Current user |
| `/api/user/profile` | PUT | ✔ | Update name/email |
| `/api/user/password` | PUT | ✔ | Change password |
| `/api/income/add` | POST | ✔ | Add income |
| `/api/income/get` | GET | ✔ | List all income |
| `/api/income/update/:id` | PUT | ✔ | Update income |
| `/api/income/delete/:id` | DELETE | ✔ | Delete income |
| `/api/income/overview` | GET | ✔ | Totals for a range (`?range=daily\|weekly\|monthly\|yearly`) |
| `/api/income/downloadexcel` | GET | ✔ | Export income as `.xlsx` |
| `/api/expense/*` | — | ✔ | Same shape as income routes |
| `/api/dashboard` | GET | ✔ | Combined monthly overview |

<details>
<summary><strong>Example — add an income transaction</strong></summary>

**Request**
```http
POST /api/income/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Freelance payment",
  "amount": 250,
  "category": "Freelance",
  "date": "2026-08-10T15:30:00.000Z"
}
```

**Response**
```json
{
  "success": true,
  "message": "Income added successfully!"
}
```
</details>

<details>
<summary><strong>Example — login</strong></summary>

**Request**
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

**Error shape** (used consistently across all endpoints):
```json
{ "success": false, "message": "Invalid email or password" }
```
</details>

---

## Notes

- Timezone handling: dates are normalized to the client's local day when filtering "Today" / "This Week" etc., to avoid UTC-offset day-boundary mismatches.
- `xlsx` export writes to an in-memory buffer per request (not a shared file) so concurrent downloads don't collide.

---

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT).
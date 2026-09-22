# 💰 Track My Spend

A lightweight, friendly expense-tracking web app that helps you see where your money goes — without the clutter of over-engineered finance tools.

## ✨ Features

- 💸 **Budget Alerts** — get notified when a category nears or exceeds your set limit
- 📊 **Instant Insights** — top categories, totals, and trends at a glance (table, pie chart, bar chart views)
- 🔔 **Smart Notifications** — customizable daily, weekly, and monthly alerts
- 🤖 **Built-in AI Assistant** — chat with ExpenseBot for tips, summaries, and setting alerts
- 🌍 **Multi-Currency Support** — USD, INR, EUR with automatic conversion
- 📂 **Data Export** — download your expenses as CSV, JSON, or ZIP
- 🗂️ **Expense Management** — add, view, filter, and delete expenses with ease
- 📱 **Responsive Design** — works well on any device
- 👤 **User Accounts** — register, login, password reset, and account reactivation
- 📈 **Usage Stats** — track logins, time spent, and activity history in your profile

## 🏗️ Tech Stack

- **Frontend:** React (Vite), React Router, Recharts, JSZip
- **Backend:** FastAPI (Python) and/or Node.js/Express (`server.js`)
- **Data storage:** CSV-based expense records, SQLite for user accounts

## 📁 Project Structure

```
trackmyspend/
├── backend/
│   ├── main.py            # FastAPI server (expense CRUD)
│   ├── server.js          # Node/Express server (auth, chatbot, etc.)
│   └── User.db            # SQLite user database (gitignored)
├── public/
│   └── vite.svg
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ActionButtons.jsx
│   │   ├── AddExpenseForm.jsx
│   │   ├── ChatBotWidget.jsx
│   │   ├── DeleteExpenseTable.jsx
│   │   ├── ExpenseStats.jsx
│   │   ├── NotificationsBell.jsx
│   │   ├── ProfileMenu.jsx
│   │   ├── SettingsMenu.jsx
│   │   └── ViewExpenseForm.jsx
│   ├── styles/             # Component-scoped CSS
│   ├── assets/             # Images/logos
│   ├── Home.jsx
│   ├── WelcomePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── ReactivatePage.jsx
│   ├── AboutPage.jsx
│   ├── ContactPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.13+ (if using the FastAPI backend)

### Installation

```bash
# Clone the repo
git clone git@github.com:VenkatAkhilKande-eng/track-my-spend.git
cd track-my-spend

# Install frontend dependencies
npm install

# Install backend dependencies (Python)
cd backend
pip install -r requirements.txt
```

### Running locally

```bash
# Start the frontend (Vite dev server)
npm run dev

# Start the FastAPI backend
cd backend
uvicorn main:app --reload

# Start the Node backend (if used, for auth/chatbot)
node server.js
```

The frontend runs on `http://localhost:5173` by default. Backend services run on `http://localhost:5000` (Node) and/or `http://localhost:8000` (FastAPI) — adjust CORS settings in `main.py` / `server.js` if you change ports.

### Environment Variables

Create a `.env` file in the backend directory for any secrets (API keys, DB paths, etc.). This file is gitignored and should never be committed.

## 📌 Roadmap

- 🔗 Bank sync & auto-categorization
- 🧾 Receipt scan (OCR) from phone
- 🌓 Dark mode & custom themes
- 👥 Shared budgets with family
- 📬 Daily/weekly email summaries

## 🤝 Contributing

This is a personal mini-project, but feedback and feature ideas are always welcome — see the in-app Contact page or reach out directly.

## 📄 License

This project is currently unlicensed / personal use. Update this section if you decide to open-source it.

---

*A Mini Project by VAK*

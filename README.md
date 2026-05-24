# Inventory Pro

A modern MERN inventory management platform for shopkeepers with authentication, stock tracking, profit/loss analytics, notifications, charts, reporting, and responsive dashboard UI.

## Features

- Secure register/login with JWT
- Protected routes and profile settings
- Forgot password and reset password flow
- Product CRUD with quantity adjustments
- Low stock and out-of-stock automation
- Out-of-stock section and removed product history
- Profit and loss summaries
- Dashboard analytics cards and charts
- Notification center and toast alerts
- Export inventory reports to Excel and PDF
- Responsive, dark-mode-first SaaS UI

## Project Structure

- `backend/`
  - `server.js`
  - `config/`
  - `controllers/`
  - `models/`
  - `routes/`
  - `middleware/`
- `frontend/`
  - `src/components/`
  - `src/context/`
  - `src/pages/`
  - `src/services/`
  - `src/utils/`

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

## Environment Setup

### Backend

Create a `.env` file in `backend/` using the template in `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory-management
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:5173
```

### Frontend

Create a `.env` file in `frontend/` using `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run locally

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Verification

Verified commands:

- `cd frontend && npm run build`
- `cd backend && node --check server.js && node --check config/db.js && node --check middleware/authMiddleware.js && node --check middleware/errorHandler.js && node --check models/User.js && node --check models/Product.js && node --check models/Notification.js && node --check models/RemovedProduct.js && node --check controllers/authController.js && node --check controllers/productController.js && node --check controllers/notificationController.js && node --check controllers/reportController.js && node --check routes/authRoutes.js && node --check routes/productRoutes.js && node --check routes/notificationRoutes.js && node --check routes/reportRoutes.js`
- `Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content`

If you want, I can also add a one-command root script to start both services together.

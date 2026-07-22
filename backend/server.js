import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import businessProfileRoutes from './routes/businessProfileRoutes.js';

import errorHandler from './middleware/errorHandler.js';

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

const PORT = process.env.PORT || 5000;

app.use(helmet());


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);


app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(compression());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const isProd = process.env.NODE_ENV === 'production';

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 200 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  '/api/auth/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 30 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// app.get('/api/health', (_req, res) => {
//   res.json({
//     status: 'ok',
//     message: 'Inventory API is healthy',
//     timestamp: new Date().toISOString(),
//   });
// });

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running"
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use(
  '/api/notifications',
  notificationRoutes
);

app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/business-profile', businessProfileRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

const bootstrap = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Failed to bootstrap server',
      error
    );

    process.exit(1);
  }
};

bootstrap();
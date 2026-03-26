const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Security & Optimization Middleware
app.use(helmet()); // HTTP header security
app.use(compression()); // Gzip compression for faster payload transfer
app.use(morgan('dev')); // HTTP request logging

// Basic Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable trust proxy so rate limiters work behind localhost Next.js proxy/vite
app.set('trust proxy', 1);

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Basic route
app.get('/', (req, res) => {
  res.send('RestroSathi API is running...');
});

const { errorHandler } = require('./src/middlewares/errorMiddleware');

// Import Routes
app.use('/api/auth', authLimiter, require('./src/modules/auth/auth.routes'));
app.use('/api/restaurants', require('./src/modules/restaurant/restaurant.routes'));
app.use('/api/menu', require('./src/modules/menu/menu.routes'));
app.use('/api/orders', require('./src/modules/order/order.routes'));

// Global Error Handler
app.use(errorHandler);

module.exports = app;

// src/index.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import penghuniRoutes from './routes/penghuniRoutes.js';
import kamarRoutes from './routes/kamarRoutes.js';          

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database
await connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));
app.use(express.static('public'));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Home"
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/penghuni', penghuniRoutes);
app.use('/api/kamar', kamarRoutes);           


// Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Kos Siyani Backend API',
    version: '1.0.0',
    description: 'Backend API untuk sistem manajemen kos',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        getCurrentUser: 'GET /api/auth/me',
        createAdmin: 'POST /api/auth/create-admin',
        getAllUsers: 'GET /api/auth/users (pemilik only)',
      },
      penghuni: {
        getAll: 'GET /api/penghuni',
        create: 'POST /api/penghuni',
        getById: 'GET /api/penghuni/:id',
        update: 'PATCH /api/penghuni/:id',
        delete: 'DELETE /api/penghuni/:id',
        restore: 'PATCH /api/penghuni/:id/restore',
        changeStatus: 'PATCH /api/penghuni/:id/status',
        getStats: 'GET /api/penghuni/stats/summary',
        search: 'GET /api/penghuni/search',
      },
      kamar: {                      // BARU
        getAll: 'GET /api/kamar',
        create: 'POST /api/kamar',
        getById: 'GET /api/kamar/:id',
        update: 'PATCH /api/kamar/:id',
        delete: 'DELETE /api/kamar/:id',
        restore: 'PATCH /api/kamar/:id/restore',
        changeStatus: 'PATCH /api/kamar/:id/status',
        getStats: 'GET /api/kamar/stats/summary',
        search: 'GET /api/kamar/search',
      },
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (harus paling akhir)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
═════════════════════════════════════════════════════════
             Kos Siyani Backend Server        
═════════════════════════════════════════════════════════
   Server running on: http://localhost:${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
   Database: Connected
═════════════════════════════════════════════════════════
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

export default app;

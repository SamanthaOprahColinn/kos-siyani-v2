// src/middlewares/errorHandler.js
import { ApiError } from '../utils/ApiError.js';

/**
 * Global Error Handler Middleware
 * Harus dipanggil paling akhir dalam app.use()
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log untuk development
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource tidak ditemukan`;
    error = new ApiError(404, message);
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} sudah digunakan. Gunakan nilai lain.`;
    error = new ApiError(400, message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ApiError(400, message);
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token tidak valid';
    error = new ApiError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token sudah kadaluarsa';
    error = new ApiError(401, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware untuk handle route yang tidak ditemukan
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} tidak ditemukan`);
  next(error);
};

/**
 * Async handler untuk wrap async function dalam route handler
 * Gunakan: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
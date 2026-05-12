// src/middlewares/authentication.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Ambil token dari header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Cek apakah token ada
    if (!token) {
      return res.status(401).json(
        new ApiResponse(
          401,
          null,
          'Token tidak ditemukan. Silakan login terlebih dahulu.'
        )
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user berdasarkan ID dari token
    const user = await User.findById(decoded.id);

    if (!user || user.isDeleted) {
      return res.status(401).json(
        new ApiResponse(401, null, 'User tidak ditemukan atau sudah dihapus.')
      );
    }

    if (!user.isActive) {
      return res.status(403).json(
        new ApiResponse(403, null, 'Akun Anda sudah dinonaktifkan.')
      );
    }

    // Attach user ke request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        new ApiResponse(401, null, 'Token sudah kadaluarsa. Silakan login kembali.')
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        new ApiResponse(401, null, 'Token tidak valid.')
      );
    }
    return res.status(500).json(
      new ApiResponse(500, null, 'Terjadi kesalahan pada autentikasi.')
    );
  }
};

export default protect;
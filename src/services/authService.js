// src/services/authService.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generate JWT Token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

/**
 * Login User
 */
export const loginUser = async (email, password) => {
  // Validasi input
  if (!email || !password) {
    throw new ApiError(400, 'Email dan password harus diisi');
  }

  // Cari user berdasarkan email (select password karena select: false di schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );

  if (!user) {
    throw new ApiError(401, 'Email atau password salah');
  }

  if (user.isDeleted) {
    throw new ApiError(403, 'Akun Anda telah dihapus');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Akun Anda telah dinonaktifkan');
  }

  // Cek password
  const isPasswordCorrect = await user.matchPassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Email atau password salah');
  }

  // Generate token
  const token = generateToken(user._id);

  // Update lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      id: user._id,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Verify Token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new ApiError(401, 'Token tidak valid atau sudah kadaluarsa');
  }
};

/**
 * Create User (untuk admin dan penghuni)
 */
export const createUser = async (userData) => {
  const { nama_lengkap, email, password, role } = userData;

  // Cek apakah email sudah terdaftar
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, 'Email sudah digunakan');
  }

  // Create user baru
  const user = await User.create({
    nama_lengkap,
    email: email.toLowerCase(),
    password,
    role,
  });

  return {
    id: user._id,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    role: user.role,
  };
};

/**
 * CHANGE PASSWORD - User ubah password mereka sendiri
 * @param {string} userId - User ID yang login
 * @param {string} passwordLama - Password lama
 * @param {string} passwordBaru - Password baru
 */
export const changePassword = async (userId, passwordLama, passwordBaru) => {
  // 1. Cari user berdasarkan ID
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User tidak ditemukan');
  }

  // 2. Validasi password lama (pastikan benar)
  const isPasswordMatch = await user.matchPassword(passwordLama);

  if (!isPasswordMatch) {
    throw new ApiError(401, 'Password lama tidak sesuai');
  }

  // 3. Validasi password baru tidak sama dengan password lama
  if (passwordLama === passwordBaru) {
    throw new ApiError(400, 'Password baru tidak boleh sama dengan password lama');
  }

  // 4. Update password
  user.password = passwordBaru;
  await user.save();

  // 5. Return success (tanpa password di response)
  return {
    _id: user._id,
    email: user.email,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
    message: 'Password berhasil diubah',
  };
};

/**
 * VALIDATE TOKEN & GET USER
 * Helper function untuk verify user di endpoint change password
 */
export const getUserFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id);
  } catch (error) {
    return null;
  }
};
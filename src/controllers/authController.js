// src/controllers/authController.js
import { asyncHandler } from '../middlewares/errorHandler.js';
import { loginUser, createUser } from '../services/authService.js';
import { successResponse } from '../utils/ApiResponse.js';
import User from '../models/User.js';
import Penghuni from '../models/Penghuni.js';

/**
 * Login endpoint
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData;

  const result = await loginUser(email, password);

  return successResponse(res, 200, result, 'Login berhasil');
});

/**
 * Create Admin endpoint
 * POST /api/auth/create-admin
 * Hanya admin dan pemilik yang bisa akses
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const { nama_lengkap, email, password, role } = req.validatedData;

  // Create user
  const user = await createUser({
    nama_lengkap,
    email,
    password,
    role,
  });

  return successResponse(res, 201, user, 'Admin berhasil dibuat');
});

/**
 * Get current user endpoint
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  return successResponse(res, 200, user, 'Data user berhasil diambil');
});

/**
 * Get all users (hanya pemilik)
 * GET /api/auth/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  let filter = { isDeleted: false };

  if (role) {
    filter.role = role;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(filter),
  ]);

  return successResponse(
    res,
    200,
    {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Daftar user berhasil diambil'
  );
});

/**
 * Deactivate user
 * PATCH /api/auth/users/:id/deactivate
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Anda tidak bisa menonaktifkan akun Anda sendiri',
    });
  }

  user.isActive = false;
  await user.save();

  return successResponse(
    res,
    200,
    { id: user._id, isActive: user.isActive },
    'User berhasil dinonaktifkan'
  );
});

/**
 * Activate user
 * PATCH /api/auth/users/:id/activate
 */
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
    });
  }

  user.isActive = true;
  await user.save();

  return successResponse(
    res,
    200,
    { id: user._id, isActive: user.isActive },
    'User berhasil diaktifkan'
  );
});

/**
 * Delete user permanently
 * DELETE /api/auth/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Anda tidak bisa menghapus akun Anda sendiri',
    });
  }

  user.isDeleted = true;
  await user.save();

  return successResponse(
    res,
    200,
    null,
    'User berhasil dihapus'
  );
});

/**
 * PATCH /api/auth/change-password
 * User ubah password mereka sendiri
 * 
 * REQUIRED:
 * - User harus login (JWT token)
 * - Body validation via middleware
 */
export const changePasswordController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { password_lama, password_baru, konfirmasi_password } = req.validatedData;

  // Validasi konfirmasi password (backup validation)
  if (password_baru !== konfirmasi_password) {
    throw new ApiError(400, 'Konfirmasi password tidak sesuai');
  }

  // Change password via service
  const result = await changePassword(userId, password_lama, password_baru);

  // Return success response
  return successResponse(
    res,
    200,
    {
      email: result.email,
      nama_lengkap: result.nama_lengkap,
      message: 'Password berhasil diubah',
    },
    'Password berhasil diubah. Silakan login kembali dengan password baru'
  );
});

/**
 * PATCH /api/auth/profile
 * Penghuni update nama mereka sendiri
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { nama_lengkap } = req.body;

  if (!nama_lengkap || nama_lengkap.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Nama minimal 3 karakter' });
  }

  const trimmed = nama_lengkap.trim();

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  }

  user.nama_lengkap = trimmed;
  await user.save();

  if (user.role === 'penghuni') {
    await Penghuni.findOneAndUpdate({ user_id: req.user._id }, { nama_lengkap: trimmed });
  }

  return successResponse(res, 200, { nama_lengkap: trimmed }, 'Nama berhasil diperbarui');
});

/**
 * EXPORT untuk digunakan di routes
 */
export const changePassword_endpoint = changePasswordController;
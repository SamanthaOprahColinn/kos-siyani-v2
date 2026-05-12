// src/middlewares/authorization.js
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Middleware untuk mengecek role user
 * Gunakan: authorizeRoles('pemilik', 'admin')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Pastikan user sudah ter-authenticate (protect middleware harus dipanggil terlebih dahulu)
    if (!req.user) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Anda harus login terlebih dahulu.')
      );
    }

    // Cek apakah role user ada di dalam allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        new ApiResponse(
          403,
          null,
          `Akses ditolak. Anda harus memiliki role: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Middleware khusus untuk endpoint kelola penghuni
 * Hanya pemilik dan admin yang bisa akses
 */
export const authorizeKelolaPenghuni = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Anda harus login terlebih dahulu.')
    );
  }

  // Penghuni tidak boleh akses endpoint kelola penghuni
  if (req.user.role === 'penghuni') {
    return res.status(403).json(
      new ApiResponse(
        403,
        null,
        'Penghuni tidak memiliki akses ke endpoint kelola penghuni.'
      )
    );
  }

  next();
};

export default authorizeRoles;
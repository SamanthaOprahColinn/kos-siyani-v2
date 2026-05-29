// src/routes/pembayaranRoutes.js
import express from 'express';
import {
  create,
  getAll,
  getById,
  getMyBills,
  update,
  uploadPaymentProof,
  deletePaymentProof,
  validate,
  delete_,
  restore,
  getStats,
  search,
  getDeleted,
} from '../controllers/pembayaranController.js';
import { protect } from '../middlewares/authentication.js';
import { authorizeRoles } from '../middlewares/authorization.js';
import {
  validateRequest,
  createPembayaranSchema,
  updatePembayaranSchema,
  validatePembayaranSchema,
} from '../validators/pembayaranValidator.js';
import { upload, handleUploadError } from '../config/multer.js';

const router = express.Router();

/**
 * MIDDLEWARE: Semua route pembayaran harus authenticated
 */
router.use(protect);

/**
 * ========================================
 * ROUTES UNTUK PENGHUNI
 * ========================================
 */

/**
 * GET /api/pembayaran/my-bills
 * Penghuni melihat tagihan mereka sendiri
 */
router.get(
  '/my-bills',
  authorizeRoles('penghuni'),
  getMyBills
);

/**
 * PATCH /api/pembayaran/:id/upload
 * Penghuni upload bukti pembayaran
 * HARUS SEBELUM route :id lainnya!
 */
router.patch(
  '/:id/upload',
  authorizeRoles('penghuni'),
  upload.single('bukti_transfer'),
  handleUploadError,
  uploadPaymentProof
);

/**
 * DELETE /api/pembayaran/:id/bukti
 * Penghuni hapus bukti pembayaran
 */
router.delete(
  '/:id/bukti',
  authorizeRoles('penghuni'),
  deletePaymentProof
);

/**
 * ========================================
 * ROUTES UNTUK ADMIN & PEMILIK
 * ========================================
 */

/**
 * GET /api/pembayaran/stats/summary
 * Lihat statistik pembayaran
 * HARUS SEBELUM GET :id!
 */
router.get(
  '/stats/summary',
  authorizeRoles('pemilik', 'admin'),
  getStats
);

/**
 * GET /api/pembayaran/deleted/all
 * Lihat pembayaran yang sudah dihapus
 * HARUS SEBELUM GET :id!
 */
router.get(
  '/deleted/all',
  authorizeRoles('pemilik', 'admin'),
  getDeleted
);

/**
 * GET /api/pembayaran/search
 * Cari pembayaran
 * HARUS SEBELUM GET :id!
 */
router.get(
  '/search',
  authorizeRoles('pemilik', 'admin'),
  search
);

/**
 * GET /api/pembayaran
 * Lihat semua pembayaran
 */
router.get(
  '/',
  authorizeRoles('pemilik', 'admin'),
  getAll
);

/**
 * POST /api/pembayaran
 * Buat tagihan pembayaran baru
 */
router.post(
  '/',
  authorizeRoles('pemilik', 'admin'),
  validateRequest(createPembayaranSchema),
  create
);

/**
 * ========================================
 * ROUTES DENGAN ID - HARUS PALING BAWAH!
 * ========================================
 */

/**
 * GET /api/pembayaran/:id
 * Lihat detail pembayaran
 */
router.get(
  '/:id',
  authorizeRoles('pemilik', 'admin'),
  getById
);

/**
 * PATCH /api/pembayaran/:id/validate
 * Admin/Pemilik validasi pembayaran (lunas/ditolak)
 * HARUS SEBELUM PATCH :id umum!
 */
router.patch(
  '/:id/validate',
  authorizeRoles('pemilik', 'admin'),
  validateRequest(validatePembayaranSchema),
  validate
);

/**
 * PATCH /api/pembayaran/:id/restore
 * Restore pembayaran yang dihapus
 * HARUS SEBELUM PATCH :id umum!
 */
router.patch(
  '/:id/restore',
  authorizeRoles('pemilik', 'admin'),
  restore
);

/**
 * PATCH /api/pembayaran/:id
 * Update pembayaran
 */
router.patch(
  '/:id',
  authorizeRoles('pemilik', 'admin'),
  validateRequest(updatePembayaranSchema),
  update
);

/**
 * DELETE /api/pembayaran/:id
 * Hapus (soft delete) pembayaran
 */
router.delete(
  '/:id',
  authorizeRoles('pemilik', 'admin'),
  delete_
);

export default router;
// src/routes/penghuniRoutes.js
import express from 'express';
import {
  create,
  getAll,
  getById,
  update,
  delete_,
  restore,
  changeStatus,
  getStats,
  getDeleted,
  search,
} from '../controllers/penghuniController.js';
import { protect } from '../middlewares/authentication.js';
import { authorizeRoles, authorizeKelolaPenghuni } from '../middlewares/authorization.js';
import {
  validateRequest,
  createPenghuniSchema,
  updatePenghuniSchema,
} from '../validators/penghuniValidator.js';

const router = express.Router();

/**
 * Middleware untuk semua route di sini: harus authenticated
 */
router.use(protect);

/**
 * Routes yang bisa diakses semua user terautentikasi
 */

// Search penghuni
router.get('/search', search);

// Get statistik penghuni (hanya admin & pemilik)
router.get('/stats/summary', authorizeRoles('pemilik', 'admin'), getStats);

// Get all penghuni
router.get('/', authorizeRoles('pemilik', 'admin'), getAll);

// Get deleted penghuni
router.get('/deleted/all', authorizeRoles('pemilik', 'admin'), getDeleted);

/**
 * Routes yang hanya admin & pemilik bisa akses
 */

// Create penghuni
router.post(
  '/',
  authorizeRoles('pemilik', 'admin'),
  validateRequest(createPenghuniSchema),
  create
);

// Get penghuni by ID
router.get('/:id', authorizeKelolaPenghuni, getById);

// Update penghuni
router.patch(
  '/:id',
  authorizeRoles('pemilik', 'admin'),
  validateRequest(updatePenghuniSchema),
  update
);

// Delete penghuni (soft delete)
router.delete('/:id', authorizeRoles('pemilik', 'admin'), delete_);

// Restore penghuni
router.patch('/:id/restore', authorizeRoles('pemilik', 'admin'), restore);

// Change status penghuni
router.patch('/:id/status', authorizeRoles('pemilik', 'admin'), changeStatus);

export default router;
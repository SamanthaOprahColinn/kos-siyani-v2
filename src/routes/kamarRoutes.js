// src/routes/kamarRoutes.js
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
  search,
  getDeleted,
} from '../controllers/kamarController.js';
import { protect } from '../middlewares/authentication.js';
import { authorizeRoles } from '../middlewares/authorization.js';
import {
  validateRequest,
  createKamarSchema,
  updateKamarSchema,
} from '../validators/kamarValidator.js';

const router = express.Router();

/**
 * Middleware untuk semua route kamar: harus authenticated
 * dan hanya pemilik & admin yang bisa akses
 */
router.use(protect);
router.use(authorizeRoles('pemilik', 'admin'));

/**
 * CRUD Routes
 */

// Get all kamar
router.get('/', getAll);

// Get deleted kamar
router.get('/deleted/all', getDeleted);

// Get kamar statistics
router.get('/stats/summary', getStats);

// Search kamar
router.get('/search', search);

// Create kamar
router.post('/', validateRequest(createKamarSchema), create);

// Get kamar by ID
router.get('/:id', getById);

// Update kamar
router.patch('/:id', validateRequest(updateKamarSchema), update);

// Delete kamar (soft delete)
router.delete('/:id', delete_);

// Restore kamar
router.patch('/:id/restore', restore);

// Change kamar status
router.patch('/:id/status', changeStatus);

export default router;
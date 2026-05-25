// src/controllers/kamarController.js
import { asyncHandler } from '../middlewares/errorHandler.js';
import {
  createKamar,
  getAllKamar,
  getKamarById,
  updateKamar,
  deleteKamar,
  restoreKamar,
  changeKamarStatus,
  getKamarStats,
  searchKamar,
  getDeletedKamar,
} from '../services/kamarService.js';
import { successResponse } from '../utils/ApiResponse.js';

/**
 * Create kamar
 * POST /api/v1/kamar
 */
export const create = asyncHandler(async (req, res) => {
  const kamar = await createKamar(req.validatedData);

  return successResponse(res, 201, kamar, 'Kamar berhasil dibuat');
});

/**
 * Get all kamar
 * GET /api/v1/kamar?sort=nomor_kamar&status=tersedia&page=1&limit=10
 */
export const getAll = asyncHandler(async (req, res) => {
  const { search, status, tipe, page, limit, sort } = req.query;

  const result = await getAllKamar({
    search,
    status,
    tipe,
    page,
    limit,
    sort,
  });

  return successResponse(res, 200, result, 'Data kamar berhasil diambil');
});

/**
 * Get kamar by ID
 * GET /api/v1/kamar/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kamar = await getKamarById(id);

  return successResponse(res, 200, kamar, 'Data kamar berhasil diambil');
});

/**
 * Update kamar
 * PATCH /api/v1/kamar/:id
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kamar = await updateKamar(id, req.validatedData);

  return successResponse(res, 200, kamar, 'Kamar berhasil diperbarui');
});

/**
 * Delete kamar (soft delete)
 * DELETE /api/v1/kamar/:id
 */
export const delete_ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kamar = await deleteKamar(id);

  return successResponse(res, 200, kamar, 'Kamar berhasil dihapus');
});

/**
 * Restore kamar
 * PATCH /api/v1/kamar/:id/restore
 */
export const restore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kamar = await restoreKamar(id);

  return successResponse(res, 200, kamar, 'Kamar berhasil dipulihkan');
});

/**
 * Change kamar status
 * PATCH /api/v1/kamar/:id/status
 * Body: { status_kamar: 'tersedia' | 'tidak tersedia' }
 */
export const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status_kamar } = req.body;

  const kamar = await changeKamarStatus(id, status_kamar);

  return successResponse(res, 200, kamar, 'Status kamar berhasil diubah');
});

/**
 * Get kamar statistics
 * GET /api/v1/kamar/stats/summary
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getKamarStats();

  return successResponse(res, 200, stats, 'Statistik kamar berhasil diambil');
});

/**
 * Search kamar
 * GET /api/v1/kamar/search?q=A&page=1&limit=10
 */
export const search = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;

  const result = await searchKamar({ q, page, limit });

  return successResponse(res, 200, result, 'Hasil pencarian berhasil diambil');
});

/**
 * Get deleted kamar
 * GET /api/v1/kamar/deleted/all
 */
export const getDeleted = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await getDeletedKamar(page, limit);

  return successResponse(
    res,
    200,
    result,
    'Data kamar yang dihapus berhasil diambil'
  );
});
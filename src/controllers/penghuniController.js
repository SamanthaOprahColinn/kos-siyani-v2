// src/controllers/penghuniController.js
import { asyncHandler } from '../middlewares/errorHandler.js';
import {
  createPenghuni,
  getAllPenghuni,
  getPenghuniById,
  updatePenghuni,
  deletePenghuni,
  restorePenghuni,
  changePenghuniStatus,
  getPenghuniStats,
} from '../services/penghuniService.js';
import { successResponse } from '../utils/ApiResponse.js';
import Penghuni from '../models/Penghuni.js';

/**
 * Create Penghuni
 * POST /api/penghuni
 */
export const create = asyncHandler(async (req, res) => {
  const { nama_lengkap, no_ktp, no_hp, email, alamat_asal, id_kamar, tanggal_masuk, catatan } = req.validatedData;

  // Generate temporary password untuk penghuni
  const tempPassword = `Penghuni@${no_ktp.slice(-6)}`;

  const penghuni = await createPenghuni({
    nama_lengkap,
    no_ktp,
    no_hp,
    email,
    alamat_asal,
    id_kamar,
    tanggal_masuk,
    catatan,
    password: tempPassword,
  });

  return successResponse(res, 201, penghuni, 'Penghuni berhasil dibuat. Password default: ' + tempPassword);
});

/**
 * Get All Penghuni
 * GET /api/penghuni?search=...&status=aktif&page=1&limit=10&sortBy=nama_lengkap&sortOrder=asc
 */
export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page, limit, sortBy, sortOrder } = req.query;

  const result = await getAllPenghuni({
    search,
    status,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  return successResponse(res, 200, result, 'Data penghuni berhasil diambil');
});

/**
 * Get Penghuni by ID
 * GET /api/penghuni/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const penghuni = await getPenghuniById(id);

  return successResponse(res, 200, penghuni, 'Data penghuni berhasil diambil');
});

/**
 * Update Penghuni
 * PATCH /api/penghuni/:id
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const penghuni = await updatePenghuni(id, req.validatedData);

  return successResponse(res, 200, penghuni, 'Penghuni berhasil diperbarui');
});

/**
 * Delete Penghuni (Soft Delete)
 * DELETE /api/penghuni/:id
 */
export const delete_ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const penghuni = await deletePenghuni(id);

  return successResponse(res, 200, penghuni, 'Penghuni berhasil dihapus');
});

/**
 * Restore Penghuni (Undo soft delete)
 * PATCH /api/penghuni/:id/restore
 */
export const restore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const penghuni = await restorePenghuni(id);

  return successResponse(res, 200, penghuni, 'Penghuni berhasil dipulihkan');
});

/**
 * Change Status Penghuni
 * PATCH /api/penghuni/:id/status
 * Body: { status_penghuni: 'aktif' | 'keluar' }
 */
export const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status_penghuni } = req.body;

  if (!status_penghuni || !['aktif', 'keluar'].includes(status_penghuni)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Status harus "aktif" atau "keluar"',
    });
  }

  const penghuni = await changePenghuniStatus(id, status_penghuni);

  return successResponse(res, 200, penghuni, 'Status penghuni berhasil diubah');
});

/**
 * Get Penghuni Statistics
 * GET /api/penghuni/stats/summary
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getPenghuniStats();

  return successResponse(res, 200, stats, 'Statistik penghuni berhasil diambil');
});

/**
 * Get Deleted Penghuni
 * GET /api/penghuni/deleted/all
 */
export const getDeleted = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [penghuni, total] = await Promise.all([
    Penghuni.find({ isDeleted: true })
      .skip(skip)
      .limit(limitNum)
      .sort({ deletedAt: -1 })
      .populate('user_id', 'email role isActive')
      .lean(),
    Penghuni.countDocuments({ isDeleted: true }),
  ]);

  return successResponse(
    res,
    200,
    {
      data: penghuni,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Data penghuni yang dihapus berhasil diambil'
  );
});

/**
 * Search Penghuni
 * GET /api/penghuni/search?q=...
 */
export const search = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter pencarian (q) harus diisi',
    });
  }

  const result = await getAllPenghuni({
    search: q,
    page,
    limit,
  });

  return successResponse(res, 200, result, 'Hasil pencarian berhasil diambil');
});
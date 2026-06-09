// src/controllers/pembayaranController.js
import { asyncHandler } from '../middlewares/errorHandler.js';
import {
  createPembayaran,
  getAllPembayaran,
  getPembayaranById,
  getPembayaranByPenghuniId,
  updatePembayaran,
  uploadBukti,
  deleteBukti,
  validatePembayaran,
  deletePembayaran,
  restorePembayaran,
  getPembayaranStats,
  searchPembayaran,
  getDeletedPembayaran,
} from '../services/pembayaranService.js';
import { successResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { convertToBase64, getFileInfo } from '../config/multer.js';
import Penghuni from '../models/Penghuni.js';
import Pembayaran from '../models/Pembayaran.js';

/**
 * ========================================
 * ENDPOINTS UNTUK PENGHUNI
 * ========================================
 */

/**
 * GET /api/pembayaran/my-bills
 * Penghuni melihat tagihan miliknya sendiri
 */
export const getMyBills = asyncHandler(async (req, res) => {
  const { status, page, limit, sort } = req.query;

  // Cari penghuni berdasarkan user_id yang login
  const penghuni = await Penghuni.findOne({ user_id: req.user._id });

  if (!penghuni) {
    throw new ApiError(404, 'Data penghuni tidak ditemukan');
  }

  // Ambil pembayaran milik penghuni ini
  const result = await getPembayaranByPenghuniId(penghuni._id, {
    status,
    page,
    limit,
    sort,
  });

  return successResponse(
    res,
    200,
    result,
    'Tagihan Anda berhasil diambil'
  );
});

/**
 * PATCH /api/pembayaran/:id/upload
 * Penghuni upload bukti pembayaran
 */
export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validasi file ada
  if (!req.file) {
    throw new ApiError(
      400,
      'File bukti pembayaran harus di-upload (form-data, key: bukti_transfer)'
    );
  }

  // Cari penghuni dari user yang login
  const penghuni = await Penghuni.findOne({ user_id: req.user._id });

  if (!penghuni) {
    throw new ApiError(404, 'Data penghuni tidak ditemukan');
  }

  // Convert file ke base64
  const buktiBase64 = convertToBase64(req.file);
  const fileInfo = getFileInfo(req.file);

  if (!buktiBase64) {
    throw new ApiError(400, 'Gagal convert file ke base64');
  }

  // Upload bukti
  const pembayaran = await uploadBukti(
    id,
    penghuni._id,
    buktiBase64,
    fileInfo.originalName
  );

  // Exclude base64 dari response
  const response = pembayaran.toObject();
  delete response.bukti_bayar;

  return successResponse(
    res,
    200,
    response,
    'Bukti pembayaran berhasil di-upload'
  );
});

/**
 * GET /api/pembayaran/:id/bukti
 * Lihat bukti pembayaran
 */
export const getBuktiImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let pembayaran;

  // Penghuni hanya bisa lihat miliknya sendiri
  if (req.user.role === 'penghuni') {
    const penghuni = await Penghuni.findOne({ user_id: req.user._id });

    if (!penghuni) {
      throw new ApiError(403, 'Data penghuni tidak ditemukan');
    }

    pembayaran = await Pembayaran.findOne({
      _id: id,
      id_penghuni: penghuni._id,
    });
  } else {
    // Jika admin/pemilik, mereka bebas melihat bukti pembayaran berdasarkan ID
    pembayaran = await Pembayaran.findById(id).select('bukti_bayar nama_file_bukti tanggal_bayar');
  }

  if (!pembayaran) {
    throw new ApiError(404, 'Data pembayaran tidak ditemukan');
  }

  if (!pembayaran.bukti_bayar) {
    throw new ApiError(404, 'Bukti pembayaran belum diunggah oleh penghuni');
  }

  return successResponse(
    res,
    200,
    {
      bukti_bayar: pembayaran.bukti_bayar,
      nama_file: pembayaran.nama_file_bukti,
      tanggal_upload: pembayaran.tanggal_bayar,
    },
    'Bukti pembayaran berhasil diambil'
  );
});

/**
 * DELETE /api/pembayaran/:id/bukti
 * Penghuni hapus bukti pembayaran
 */
export const deletePaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cari penghuni dari user yang login
  const penghuni = await Penghuni.findOne({ user_id: req.user._id });

  if (!penghuni) {
    throw new ApiError(404, 'Data penghuni tidak ditemukan');
  }

  // Hapus bukti
  const pembayaran = await deleteBukti(id, penghuni._id);

  return successResponse(
    res,
    200,
    pembayaran,
    'Bukti pembayaran berhasil dihapus'
  );
});

/**
 * ========================================
 * ENDPOINTS UNTUK ADMIN & PEMILIK
 * ========================================
 */

/**
 * POST /api/pembayaran
 * Admin/Pemilik buat tagihan pembayaran
 */
export const create = asyncHandler(async (req, res) => {
  const pembayaran = await createPembayaran(req.validatedData);

  return successResponse(
    res,
    201,
    pembayaran,
    'Tagihan berhasil dibuat'
  );
});

/**
 * GET /api/pembayaran
 * Admin/Pemilik lihat semua pembayaran dengan filter
 */
export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page, limit, sort } = req.query;

  const result = await getAllPembayaran({
    search,
    status,
    page,
    limit,
    sort,
  });

  return successResponse(
    res,
    200,
    result,
    'Data pembayaran berhasil diambil'
  );
});

/**
 * GET /api/pembayaran/:id
 * Admin/Pemilik lihat detail pembayaran
 */
export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pembayaran = await getPembayaranById(id);

  // Exclude base64 dari response
  const response = pembayaran.toObject ? pembayaran.toObject() : pembayaran;
  delete response.bukti_bayar;

  return successResponse(
    res,
    200,
    response,
    'Data pembayaran berhasil diambil'
  );
});

/**
 * PATCH /api/pembayaran/:id
 * Admin/Pemilik update pembayaran
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pembayaran = await updatePembayaran(id, req.validatedData);

  return successResponse(
    res,
    200,
    pembayaran,
    'Pembayaran berhasil diperbarui'
  );
});

/**
 * PATCH /api/pembayaran/:id/validate
 * Admin/Pemilik validasi pembayaran (lunas/ditolak)
 */
export const validate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status_bayar, catatan_admin } = req.body;

  if (!status_bayar) {
    throw new ApiError(400, 'Status pembayaran harus diisi (lunas atau ditolak)');
  }

  const pembayaran = await validatePembayaran(
    id,
    { status_bayar, catatan_admin },
    req.user._id
  );

  return successResponse(
    res,
    200,
    pembayaran,
    'Pembayaran berhasil divalidasi'
  );
});

/**
 * DELETE /api/pembayaran/:id
 * Admin/Pemilik hapus (soft delete) pembayaran
 */
export const delete_ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pembayaran = await deletePembayaran(id);

  return successResponse(
    res,
    200,
    pembayaran,
    'Pembayaran berhasil dihapus'
  );
});

/**
 * PATCH /api/pembayaran/:id/restore
 * Admin/Pemilik restore pembayaran yang dihapus
 */
export const restore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pembayaran = await restorePembayaran(id);

  return successResponse(
    res,
    200,
    pembayaran,
    'Pembayaran berhasil dipulihkan'
  );
});

/**
 * GET /api/pembayaran/stats/summary
 * Admin/Pemilik lihat statistik pembayaran
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getPembayaranStats();

  return successResponse(
    res,
    200,
    stats,
    'Statistik pembayaran berhasil diambil'
  );
});

/**
 * GET /api/pembayaran/search
 * Admin/Pemilik cari pembayaran
 */
export const search = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;

  const result = await searchPembayaran({ q, page, limit });

  return successResponse(
    res,
    200,
    result,
    'Hasil pencarian berhasil diambil'
  );
});

/**
 * GET /api/pembayaran/deleted/all
 * Admin/Pemilik lihat pembayaran yang sudah dihapus
 */
export const getDeleted = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await getDeletedPembayaran(page, limit);

  return successResponse(
    res,
    200,
    result,
    'Data pembayaran yang dihapus berhasil diambil'
  );
});
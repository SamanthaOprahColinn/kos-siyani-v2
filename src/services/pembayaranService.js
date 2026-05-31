// src/services/pembayaranService.js
import Pembayaran from '../models/Pembayaran.js';
import Penghuni from '../models/Penghuni.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * CREATE PEMBAYARAN - Buat tagihan pembayaran baru
 */
export const createPembayaran = async (pembayaranData) => {
  const {
    id_penghuni,
    id_kamar,
    bulan_tagihan,
    tahun_tagihan,
    jumlah_tagihan,
    tgl_jatuh_tempo,
    metode_pembayaran,
  } = pembayaranData;

  // 1. Validasi penghuni ada
  const penghuni = await Penghuni.findById(id_penghuni);
  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  // 2. Check duplikat tagihan (same month & year)
  const existingTagihan = await Pembayaran.findOne({
    id_penghuni,
    bulan_tagihan,
    tahun_tagihan,
    isDeleted: false,
  });

  if (existingTagihan) {
    throw new ApiError(
      400,
      `Tagihan untuk bulan ${bulan_tagihan}/${tahun_tagihan} sudah ada`
    );
  }

  // 3. Create pembayaran
  const pembayaran = await Pembayaran.create({
    id_penghuni,
    id_kamar,
    bulan_tagihan,
    tahun_tagihan,
    jumlah_tagihan,
    tgl_jatuh_tempo,
    metode_pembayaran,
  });

  return pembayaran;
};

/**
 * GET ALL PEMBAYARAN - Ambil semua pembayaran dengan filter, search, sort, pagination
 */
export const getAllPembayaran = async (queryParams = {}) => {
  const { search, status, page = 1, limit = 10, sort = '-createdAt' } = queryParams;

  // Build filter
  let filter = { isDeleted: false };

  // Filter by status
  if (status) {
    // FIXED: Validate status value
    const validStatuses = ['belum bayar', 'menunggu konfirmasi', 'lunas', 'ditolak'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Status tidak valid. Gunakan: ${validStatuses.join(', ')}`);
    }
    filter.status_bayar = status;
  }

  // Search filter
  if (search) {
    const searchNumber = parseInt(search) || -1;
    filter.$or = [
      { bulan_tagihan: searchNumber },
      { tahun_tagihan: searchNumber },
      { 'id_penghuni.nama_lengkap': { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // FIXED: Validate page & limit
  if (pageNum < 1 || limitNum < 1) {
    throw new ApiError(400, 'Page dan limit harus positif');
  }

  // Sorting - handle minus untuk descending
  const sortObject = {};
  if (sort.startsWith('-')) {
    sortObject[sort.substring(1)] = -1;
  } else {
    sortObject[sort] = 1;
  }

  // Validate sort fields
  const validSortFields = ['createdAt', 'jumlah_tagihan', 'tanggal_bayar', 'tgl_jatuh_tempo'];
  const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
  if (!validSortFields.includes(sortField)) {
    throw new ApiError(400, `Field sorting ${sortField} tidak valid`);
  }

  // Execute query - IMPORTANT: exclude base64 dari list view
  const [pembayaran, total] = await Promise.all([
    Pembayaran.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .select('-bukti_bayar') // Exclude large base64 untuk performance
      .populate({
        path: 'id_penghuni',
        select: 'nama_lengkap email no_hp',
      })
      .populate({
        path: 'id_kamar',
        select: 'nomor_kamar lantai tipe_kamar',
      })
      .lean(),
    Pembayaran.countDocuments(filter),
  ]);

  return {
    data: pembayaran,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * GET PEMBAYARAN BY ID
 */
export const getPembayaranById = async (id) => {
  const pembayaran = await Pembayaran.findById(id)
    .populate({
      path: 'id_penghuni',
      select: 'nama_lengkap email no_hp',
    })
    .populate({
      path: 'id_kamar',
      select: 'nomor_kamar lantai tipe_kamar harga_sewa',
    })
    .populate({
      path: 'verified_by',
      select: 'nama_lengkap email',
    });

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  // Note: bukti_bayar sudah termasuk dalam response (base64 string)
  return pembayaran;
};

/**
 * GET PEMBAYARAN BY PENGHUNI ID - Penghuni lihat tagihan mereka
 */
export const getPembayaranByPenghuniId = async (penghuniId, queryParams = {}) => {
  const { status, page = 1, limit = 10, sort = '-createdAt' } = queryParams;

  let filter = { id_penghuni: penghuniId, isDeleted: false };

  if (status) {
    // FIXED: Validate status
    const validStatuses = ['belum bayar', 'menunggu konfirmasi', 'lunas', 'ditolak'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Status tidak valid`);
    }
    filter.status_bayar = status;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortObject = {};
  if (sort.startsWith('-')) {
    sortObject[sort.substring(1)] = -1;
  } else {
    sortObject[sort] = 1;
  }

  const [pembayaran, total] = await Promise.all([
    Pembayaran.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .select('-bukti_bayar') // Exclude untuk performance
      .populate({
        path: 'id_kamar',
        select: 'nomor_kamar lantai tipe_kamar harga_sewa',
      })
      .lean(),
    Pembayaran.countDocuments(filter),
  ]);

  return {
    data: pembayaran,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * HELPER: Get pembayaran dengan bukti (untuk admin lihat gambar)
 */
export const getPembayaranWithImage = async (id) => {
  return await getPembayaranById(id);
  // bukti_bayar included sebagai base64 string
};

/**
 * UPDATE PEMBAYARAN
 */
export const updatePembayaran = async (id, updateData) => {
  const pembayaran = await Pembayaran.findById(id);

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  // FIXED: Prevent updating certain fields
  if (updateData.status_bayar) {
    throw new ApiError(400, 'Gunakan endpoint validate untuk mengubah status');
  }

  // Update fields
  Object.assign(pembayaran, updateData);
  await pembayaran.save();

  return pembayaran;
};

/**
 * UPLOAD BUKTI PEMBAYARAN - Upload screenshot, save as base64 di database
 */
export const uploadBukti = async (id, penghuniId, buktiBase64, namaFile) => {
  const pembayaran = await Pembayaran.findById(id);

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  // Explicit ownership verification (handle auto-populated id_penghuni)
  const storedPenghuniId = pembayaran.id_penghuni?._id
    ? pembayaran.id_penghuni._id.toString()
    : pembayaran.id_penghuni?.toString();

  if (!storedPenghuniId || storedPenghuniId !== penghuniId.toString()) {
    throw new ApiError(403, 'Anda tidak berhak mengakses pembayaran ini');
  }

  // Cek status - hanya bisa upload jika belum bayar atau ditolak
  if (pembayaran.status_bayar === 'lunas') {
    throw new ApiError(400, 'Tidak dapat submit bukti untuk pembayaran yang sudah lunas');
  }

  // Verify data ada
  if (!buktiBase64) {
    throw new ApiError(400, 'Bukti gambar harus di-upload');
  }

  // Update pembayaran dengan base64 image
  pembayaran.bukti_bayar = buktiBase64;
  pembayaran.nama_file_bukti = namaFile;
  pembayaran.status_bayar = 'menunggu konfirmasi';
  pembayaran.tanggal_bayar = new Date();

  await pembayaran.save();

  return pembayaran;
};

/**
 * DELETE BUKTI PEMBAYARAN - Hapus bukti gambar
 */
export const deleteBukti = async (id, penghuniId) => {
  const pembayaran = await Pembayaran.findById(id);

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  // Explicit ownership verification (handle auto-populated id_penghuni)
  const storedPenghuniIdDel = pembayaran.id_penghuni?._id
    ? pembayaran.id_penghuni._id.toString()
    : pembayaran.id_penghuni?.toString();

  if (!storedPenghuniIdDel || storedPenghuniIdDel !== penghuniId.toString()) {
    throw new ApiError(403, 'Anda tidak berhak mengakses pembayaran ini');
  }

  // Cek status - hanya bisa delete bukti jika menunggu konfirmasi atau ditolak
  if (!['menunggu konfirmasi', 'ditolak'].includes(pembayaran.status_bayar)) {
    throw new ApiError(
      400,
      'Hanya pembayaran dengan status "menunggu konfirmasi" atau "ditolak" yang dapat dihapus buktinya'
    );
  }

  // Pastikan ada bukti
  if (!pembayaran.bukti_bayar) {
    throw new ApiError(400, 'Tidak ada bukti pembayaran yang dapat dihapus');
  }

  // Reset pembayaran
  pembayaran.bukti_bayar = null;
  pembayaran.nama_file_bukti = null;
  pembayaran.status_bayar = 'belum bayar';
  pembayaran.tanggal_bayar = null;

  await pembayaran.save();

  return pembayaran;
};

/**
 * VALIDATE PEMBAYARAN - Admin/Pemilik validasi dan terima/tolak pembayaran
 */
export const validatePembayaran = async (id, validationData, verifierId) => {
  const pembayaran = await Pembayaran.findById(id);

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  const { status_bayar, catatan_admin } = validationData;

  // FIXED: Validate status - hanya boleh lunas atau ditolak
  if (!['lunas', 'ditolak'].includes(status_bayar)) {
    throw new ApiError(400, 'Status harus "lunas" atau "ditolak"');
  }

  // FIXED: Verify status is not already validated
  if (pembayaran.status_bayar === 'lunas') {
    throw new ApiError(400, 'Pembayaran sudah diluluskan sebelumnya');
  }

  // Update pembayaran
  pembayaran.status_bayar = status_bayar;
  pembayaran.catatan_admin = catatan_admin || '';
  pembayaran.verified_by = verifierId;

  if (status_bayar === 'lunas') {
    pembayaran.tanggal_bayar = new Date();
  }

  await pembayaran.save();

  return pembayaran;
};

/**
 * DELETE PEMBAYARAN (Soft Delete)
 */
export const deletePembayaran = async (id) => {
  const pembayaran = await Pembayaran.findById(id);

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  pembayaran.isDeleted = true;
  await pembayaran.save();

  return pembayaran;
};

/**
 * RESTORE PEMBAYARAN
 */
export const restorePembayaran = async (id) => {
  const pembayaran = await Pembayaran.findById(id, {}, { includeDeleted: true });

  if (!pembayaran) {
    throw new ApiError(404, 'Pembayaran tidak ditemukan');
  }

  if (!pembayaran.isDeleted) {
    throw new ApiError(400, 'Pembayaran tidak dalam status dihapus');
  }

  pembayaran.isDeleted = false;
  await pembayaran.save();

  return pembayaran;
};

/**
 * GET PEMBAYARAN STATISTICS
 */
export const getPembayaranStats = async () => {
  const stats = await Pembayaran.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        lunas: {
          $sum: { $cond: [{ $eq: ['$status_bayar', 'lunas'] }, 1, 0] },
        },
        belum_bayar: {
          $sum: { $cond: [{ $eq: ['$status_bayar', 'belum bayar'] }, 1, 0] },
        },
        menunggu_konfirmasi: {
          $sum: {
            $cond: [{ $eq: ['$status_bayar', 'menunggu konfirmasi'] }, 1, 0],
          },
        },
        ditolak: {
          $sum: { $cond: [{ $eq: ['$status_bayar', 'ditolak'] }, 1, 0] },
        },
        total_bayar: {
          $sum: {
            $cond: [{ $eq: ['$status_bayar', 'lunas'] }, '$jumlah_tagihan', 0],
          },
        },
        total_tunggakan: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$status_bayar',
                  ['belum bayar', 'menunggu konfirmasi', 'ditolak'],
                ],
              },
              '$jumlah_tagihan',
              0,
            ],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      lunas: 0,
      belum_bayar: 0,
      menunggu_konfirmasi: 0,
      ditolak: 0,
      total_bayar: 0,
      total_tunggakan: 0,
    };
  }

  return stats[0];
};

/**
 * SEARCH PEMBAYARAN
 */
export const searchPembayaran = async (queryParams = {}) => {
  const { q, page = 1, limit = 10 } = queryParams;

  if (!q) {
    throw new ApiError(400, 'Parameter pencarian (q) harus diisi');
  }

  const searchNumber = parseInt(q) || -1;

  const filter = {
    isDeleted: false,
    $or: [
      { bulan_tagihan: searchNumber },
      { tahun_tagihan: searchNumber },
      { status_bayar: { $regex: q, $options: 'i' } },
    ],
  };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [pembayaran, total] = await Promise.all([
    Pembayaran.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .populate({
        path: 'id_penghuni',
        select: 'nama_lengkap email',
      })
      .populate({
        path: 'id_kamar',
        select: 'nomor_kamar',
      })
      .lean(),
    Pembayaran.countDocuments(filter),
  ]);

  return {
    data: pembayaran,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * GET DELETED PEMBAYARAN
 */
export const getDeletedPembayaran = async (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [pembayaran, total] = await Promise.all([
    Pembayaran.find({ isDeleted: true })
      .skip(skip)
      .limit(limitNum)
      .sort({ updatedAt: -1 })
      .lean(),
    Pembayaran.countDocuments({ isDeleted: true }),
  ]);

  return {
    data: pembayaran,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};
// src/services/kamarService.js
import Kamar from '../models/Kamar.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Create kamar
 */
export const createKamar = async (kamarData) => {
  const { nomor_kamar } = kamarData;

  // Check unique nomor_kamar
  const existingKamar = await Kamar.findOne({ nomor_kamar });
  if (existingKamar) {
    throw new ApiError(400, 'Nomor kamar sudah terdaftar');
  }

  const kamar = await Kamar.create(kamarData);
  return kamar;
};

/**
 * Get all kamar dengan search, filter, pagination, sorting
 */
export const getAllKamar = async (queryParams = {}) => {
  const {
    search,
    status,
    tipe,
    page = 1,
    limit = 10,
    sort = 'createdAt',
  } = queryParams;

  // Build filter
  let filter = {};

  // Status filter
  if (status) {
    filter.status_kamar = status;
  }

  // Tipe filter
  if (tipe) {
    filter.tipe_kamar = tipe.toUpperCase();
  }

  // Search filter (nomor_kamar, tipe_kamar)
  if (search) {
    filter.$or = [
      { nomor_kamar: parseInt(search) || -1 },
      { tipe_kamar: search.toUpperCase() },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObject = {};
  let sortField = 'createdAt';
  let sortOrder = -1; // default descending

  if (sort) {
    if (sort.startsWith('-')) {
      sortField = sort.substring(1);
      sortOrder = -1;
    } else {
      sortField = sort;
      sortOrder = 1;
    }

    const validSortFields = [
      'nomor_kamar',
      'harga_sewa',
      'lantai',
      'createdAt',
    ];

    if (!validSortFields.includes(sortField)) {
      throw new ApiError(400, 'Field sorting tidak valid');
    }
  }

  sortObject[sortField] = sortOrder;

  // Execute query
  const [kamar, total] = await Promise.all([
    Kamar.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Kamar.countDocuments(filter),
  ]);

  return {
    data: kamar,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get kamar by ID
 */
export const getKamarById = async (id) => {
  const kamar = await Kamar.findById(id).populate({
    path: 'penghuni',
    select: 'nama_lengkap email no_hp',
  });

  if (!kamar) {
    throw new ApiError(404, 'Kamar tidak ditemukan');
  }

  return kamar;
};

/**
 * Update kamar
 */
export const updateKamar = async (id, updateData) => {
  const kamar = await Kamar.findById(id);

  if (!kamar) {
    throw new ApiError(404, 'Kamar tidak ditemukan');
  }

  // Check unique nomor_kamar jika di-update
  if (
    updateData.nomor_kamar &&
    updateData.nomor_kamar !== kamar.nomor_kamar
  ) {
    const existing = await Kamar.findOne({
      nomor_kamar: updateData.nomor_kamar,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(400, 'Nomor kamar sudah digunakan');
    }
  }

  Object.assign(kamar, updateData);
  await kamar.save();

  return kamar;
};

/**
 * Soft delete kamar
 */
export const deleteKamar = async (id) => {
  const kamar = await Kamar.findById(id);

  if (!kamar) {
    throw new ApiError(404, 'Kamar tidak ditemukan');
  }

  kamar.isDeleted = true;
  await kamar.save();

  return kamar;
};

/**
 * Restore kamar (Undo soft delete)
 */
export const restoreKamar = async (id) => {
  const kamar = await Kamar.findById(id, {}, { includeDeleted: true });

  if (!kamar) {
    throw new ApiError(404, 'Kamar tidak ditemukan');
  }

  if (!kamar.isDeleted) {
    throw new ApiError(400, 'Kamar tidak dalam status dihapus');
  }

  kamar.isDeleted = false;
  await kamar.save();

  return kamar;
};

/**
 * Change status kamar
 */
export const changeKamarStatus = async (id, newStatus) => {
  const kamar = await Kamar.findById(id);

  if (!kamar) {
    throw new ApiError(404, 'Kamar tidak ditemukan');
  }

  if (!['tersedia', 'tidak tersedia'].includes(newStatus)) {
    throw new ApiError(
      400,
      'Status harus "tersedia" atau "tidak tersedia"'
    );
  }

  kamar.status_kamar = newStatus;
  await kamar.save();

  return kamar;
};

/**
 * Get kamar statistics
 */
export const getKamarStats = async () => {
  const stats = await Kamar.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        tersedia: {
          $sum: {
            $cond: [{ $eq: ['$status_kamar', 'tersedia'] }, 1, 0],
          },
        },
        tidak_tersedia: {
          $sum: {
            $cond: [{ $eq: ['$status_kamar', 'tidak tersedia'] }, 1, 0],
          },
        },
        total_harga: { $sum: '$harga_sewa' },
        rata_harga: { $avg: '$harga_sewa' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      tersedia: 0,
      tidak_tersedia: 0,
      total_harga: 0,
      rata_harga: 0,
    };
  }

  return stats[0];
};

/**
 * Search kamar
 */
export const searchKamar = async (queryParams = {}) => {
  const { q, page = 1, limit = 10 } = queryParams;

  if (!q) {
    throw new ApiError(400, 'Parameter pencarian (q) harus diisi');
  }

  const filter = {
    $or: [
      { nomor_kamar: parseInt(q) || -1 },
      { tipe_kamar: q.toUpperCase() },
      { status_kamar: { $regex: q, $options: 'i' } },
    ],
  };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [kamar, total] = await Promise.all([
    Kamar.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean(),
    Kamar.countDocuments(filter),
  ]);

  return {
    data: kamar,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get deleted kamar
 */
export const getDeletedKamar = async (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [kamar, total] = await Promise.all([
    Kamar.find({ isDeleted: true })
      .skip(skip)
      .limit(limitNum)
      .sort({ updatedAt: -1 })
      .lean(),
    Kamar.countDocuments({ isDeleted: true }),
  ]);

  return {
    data: kamar,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};
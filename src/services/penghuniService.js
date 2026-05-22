// src/services/penghuniService.js
import Penghuni from '../models/Penghuni.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { PENGHUNI_STATUS } from '../constants/enums.js';

/**
 * Create Penghuni
 */
export const createPenghuni = async (penghuniData) => {
  const {
    nama_lengkap,
    no_ktp,
    no_hp,
    email,
    alamat_asal,
    id_kamar,
    tanggal_masuk,
    catatan,
    password,
  } = penghuniData;

  // Validasi unique fields
  const existingPenghuni = await Penghuni.findOne({
    $or: [{ no_ktp }, { email }, { no_hp }],
  });

  if (existingPenghuni) {
    throw new ApiError(400, 'Data penghuni dengan no_ktp, email, atau no_hp sudah terdaftar');
  }

  // Create user terlebih dahulu
  const user = await User.create({
    nama_lengkap,
    email: email.toLowerCase(),
    password,
    role: 'penghuni',
  });

  // Create penghuni
  const penghuni = await Penghuni.create({
    user_id: user._id,
    nama_lengkap,
    no_ktp,
    no_hp,
    email: email.toLowerCase(),
    alamat_asal,
    id_kamar,
    tanggal_masuk: tanggal_masuk || new Date(),
    catatan,
    status_penghuni: PENGHUNI_STATUS.AKTIF,
  });

  // Populate data
  await penghuni.populate('user_id');

  return penghuni;
};

/**
 * Get All Penghuni dengan search, filter, pagination, dan sorting
 */
export const getAllPenghuni = async (queryParams = {}) => {
  const {
    search,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  // Build filter
  let filter = {};

  // Status filter
  if (status) {
    filter.status_penghuni = status;
  }

  // Search filter (nama, no_ktp, no_hp, email)
  if (search) {
    filter.$or = [
      { nama_lengkap: { $regex: search, $options: 'i' } },
      { no_ktp: { $regex: search, $options: 'i' } },
      { no_hp: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObject = {};
  const validSortFields = [
    'nama_lengkap',
    'tanggal_masuk',
    'createdAt',
    'status_penghuni',
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  sortObject[sortField] = order;

  // Execute query
  const [penghuni, total] = await Promise.all([
    Penghuni.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .populate('user_id', 'email role isActive')
      .lean(),
    Penghuni.countDocuments(filter),
  ]);

  return {
    data: penghuni,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get Penghuni by ID
 */
export const getPenghuniById = async (id) => {
  const penghuni = await Penghuni.findById(id).populate(
    'user_id',
    'email role isActive'
  );

  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  return penghuni;
};

/**
 * Update Penghuni
 */
export const updatePenghuni = async (id, updateData) => {
  const penghuni = await Penghuni.findById(id);

  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  // Check unique fields jika di-update
  if (updateData.no_ktp && updateData.no_ktp !== penghuni.no_ktp) {
    const existing = await Penghuni.findOne({
      no_ktp: updateData.no_ktp,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(400, 'Nomor KTP sudah digunakan');
    }
  }

  if (updateData.no_hp && updateData.no_hp !== penghuni.no_hp) {
    const existing = await Penghuni.findOne({
      no_hp: updateData.no_hp,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(400, 'Nomor HP sudah digunakan');
    }
  }

  if (updateData.email && updateData.email.toLowerCase() !== penghuni.email) {
    const existing = await Penghuni.findOne({
      email: updateData.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(400, 'Email sudah digunakan');
    }
  }

  // Update penghuni
  Object.assign(penghuni, updateData);
  await penghuni.save();

  await penghuni.populate('user_id', 'email role isActive');

  return penghuni;
};

/**
 * Soft Delete Penghuni
 */
export const deletePenghuni = async (id) => {
  const penghuni = await Penghuni.findById(id);

  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  // Soft delete
  penghuni.isDeleted = true;
  await penghuni.save();

  // Soft delete user terkait
  await User.findByIdAndUpdate(penghuni.user_id, { isDeleted: true });

  return penghuni;
};

/**
 * Restore Penghuni (Undo soft delete)
 */
export const restorePenghuni = async (id) => {
  const penghuni = await Penghuni.findById(id, {}, { includeDeleted: true });

  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  if (!penghuni.isDeleted) {
    throw new ApiError(400, 'Penghuni tidak dalam status dihapus');
  }

  // Restore
  penghuni.isDeleted = false;
  await penghuni.save();

  // Restore user terkait
  await User.findByIdAndUpdate(penghuni.user_id, { isDeleted: false });

  await penghuni.populate('user_id', 'email role isActive');

  return penghuni;
};

/**
 * Change Status Penghuni (aktif -> keluar)
 */
export const changePenghuniStatus = async (id, newStatus) => {
  const penghuni = await Penghuni.findById(id);

  if (!penghuni) {
    throw new ApiError(404, 'Penghuni tidak ditemukan');
  }

  penghuni.status_penghuni = newStatus;

  // Jika status keluar, set tanggal_keluar
  if (newStatus === PENGHUNI_STATUS.KELUAR) {
    penghuni.tanggal_keluar = new Date();
  }

  await penghuni.save();
  await penghuni.populate('user_id', 'email role isActive');

  return penghuni;
};

/**
 * Get statistik penghuni
 */
export const getPenghuniStats = async () => {
  const stats = await Penghuni.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        aktif: {
          $sum: {
            $cond: [{ $eq: ['$status_penghuni', PENGHUNI_STATUS.AKTIF] }, 1, 0],
          },
        },
        keluar: {
          $sum: {
            $cond: [{ $eq: ['$status_penghuni', PENGHUNI_STATUS.KELUAR] }, 1, 0],
          },
        },
      },
    },
  ]);

  return stats[0] || { total: 0, aktif: 0, keluar: 0 };
};
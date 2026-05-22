// src/models/Penghuni.js
import mongoose from 'mongoose';
import { PENGHUNI_STATUS_ARRAY } from '../constants/enums.js';

const penghuniSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID wajib diisi'],
      unique: true,
    },
    id_kamar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kamar',
      required: [true, 'ID Kamar wajib diisi'],
    },
    nama_lengkap: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi'],
      trim: true,
      minlength: [3, 'Nama minimal 3 karakter'],
      maxlength: [100, 'Nama maksimal 100 karakter'],
    },
    no_ktp: {
      type: String,
      required: [true, 'Nomor KTP wajib diisi'],
      unique: true,
      trim: true,
      minlength: [16, 'Nomor KTP harus 16 digit'],
      maxlength: [16, 'Nomor KTP harus 16 digit'],
      match: [/^\d{16}$/, 'Nomor KTP harus 16 digit'],
    },
    no_hp: {
      type: String,
      required: [true, 'Nomor HP wajib diisi'],
      unique: true,
      trim: true,
      minlength: [10, 'Nomor HP minimal 10 digit'],
      maxlength: [13, 'Nomor HP maksimal 13 digit'],
      match: [/^\d{10,13}$/, 'Format nomor HP tidak valid'],
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Format email tidak valid',
      ],
    },
    alamat_asal: {
      type: String,
      required: [true, 'Alamat asal wajib diisi'],
      trim: true,
      minlength: [10, 'Alamat minimal 10 karakter'],
    },
    tanggal_masuk: {
      type: Date,
      default: Date.now,
    },
    tanggal_keluar: {
      type: Date,
      default: null,
    },
    status_penghuni: {
      type: String,
      enum: {
        values: PENGHUNI_STATUS_ARRAY,
        message: 'Status penghuni harus "aktif" atau "keluar"',
      },
      default: 'aktif',
      index: true,
    },
    keadaan_kamar: {
      type: String,
      enum: ['baik', 'rusak_ringan', 'rusak_berat'],
      default: 'baik',
    },
    catatan: {
      type: String,
      trim: true,
      maxlength: [500, 'Catatan maksimal 500 karakter'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index untuk performa query
penghuniSchema.index({ nama_lengkap: 'text', no_ktp: 'text', no_hp: 'text', email: 'text' });
penghuniSchema.index({ status_penghuni: 1, isDeleted: 1 });
penghuniSchema.index({ id_kamar: 1 });
penghuniSchema.index({ tanggal_masuk: -1 });
penghuniSchema.index({ createdAt: -1 });

// Populate virtual
penghuniSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

// Query middleware untuk soft delete
penghuniSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Auto-populate user saat find
penghuniSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'user_id',
    select: 'email role isActive',
  });
  next();
});

const Penghuni = mongoose.model('Penghuni', penghuniSchema);

export default Penghuni;
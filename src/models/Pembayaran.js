// src/models/Pembayaran.js
import mongoose from 'mongoose';

const pembayaranSchema = new mongoose.Schema(
  {
    // Relasi
    id_penghuni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Penghuni',
      required: [true, 'ID Penghuni wajib diisi'],
      index: true,
    },
    id_kamar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kamar',
      required: [true, 'ID Kamar wajib diisi'],
    },

    // Tagihan Info
    bulan_tagihan: {
      type: Number,
      required: [true, 'Bulan tagihan wajib diisi'],
      min: [1, 'Bulan minimal 1'],
      max: [12, 'Bulan maksimal 12'],
    },
    tahun_tagihan: {
      type: Number,
      required: [true, 'Tahun tagihan wajib diisi'],
    },
    jumlah_tagihan: {
      type: Number,
      required: [true, 'Jumlah tagihan wajib diisi'],
      min: [0, 'Jumlah tidak boleh negatif'],
    },
    tgl_jatuh_tempo: {
      type: Date,
      required: [true, 'Tanggal jatuh tempo wajib diisi'],
    },

    // Pembayaran Info
    metode_pembayaran: {
      type: String,
      enum: {
        values: ['transfer', 'cash', 'e-wallet'],
        message: 'Metode: transfer, cash, atau e-wallet',
      },
      default: 'transfer',
    },
    tanggal_bayar: {
      type: Date,
      default: null,
    },

    // ✨ Bukti disimpan sebagai BASE64 di database
    // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
    bukti_bayar: {
      type: String, // Base64 encoded image
      default: null,
      trim: true,
      // Note: Base64 image bisa besar (1MB image = 1.3MB base64)
      // Limit: 5MB base64 = ~3.8MB image
    },
    nama_file_bukti: {
      type: String, // Nama original file (untuk reference)
      default: null,
      trim: true,
    },

    // Status & Verifikasi
    status_bayar: {
      type: String,
      enum: {
        values: ['belum bayar', 'menunggu konfirmasi', 'lunas', 'ditolak'],
        message: 'Status tidak valid',
      },
      default: 'belum bayar',
      index: true,
    },
    catatan_admin: {
      type: String,
      trim: true,
      maxlength: [500, 'Catatan maksimal 500 karakter'],
      default: '',
    },
    catatan_penghuni: {
      type: String,
      trim: true,
      maxlength: [500, 'Catatan maksimal 500 karakter'],
      default: '',
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Soft Delete
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

// Indexes untuk performa
pembayaranSchema.index({ id_penghuni: 1, bulan_tagihan: 1, tahun_tagihan: 1 });
pembayaranSchema.index({ status_bayar: 1, isDeleted: 1 });
pembayaranSchema.index({ createdAt: -1 });

// Auto-populate penghuni dan kamar
pembayaranSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }

  this.populate({
    path: 'id_penghuni',
    select: 'nama_lengkap email no_hp',
  }).populate({
    path: 'id_kamar',
    select: 'nomor_kamar lantai tipe_kamar harga_sewa',
  });

  next();
});

// Soft delete middleware
pembayaranSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

const Pembayaran = mongoose.model('Pembayaran', pembayaranSchema);

export default Pembayaran;
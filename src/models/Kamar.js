// src/models/Kamar.js
import mongoose from 'mongoose';

const kamarSchema = new mongoose.Schema(
  {
    nomor_kamar: {
      type: Number,
      required: [true, 'Nomor kamar wajib diisi'],
      min: [1, 'Nomor kamar minimal 1'],
      max: [10, 'Nomor kamar maksimal 10'],
      unique: true,
    },
    lantai: {
      type: Number,
      required: [true, 'Lantai wajib diisi'],
      enum: {
        values: [1, 2],
        message: 'Lantai hanya boleh 1 atau 2',
      },
    },
    tipe_kamar: {
      type: String,
      required: [true, 'Tipe kamar wajib diisi'],
      enum: {
        values: ['A', 'B', 'C'],
        message: 'Tipe kamar harus A, B, atau C',
      },
    },
    harga_sewa: {
      type: Number,
      required: [true, 'Harga sewa wajib diisi'],
      default: 1000000,
      min: [0, 'Harga sewa tidak boleh negatif'],
    },
    fasilitas: {
      type: [String],
      default: ['ranjang', 'lemari', 'ac'],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'Fasilitas tidak boleh kosong',
      },
    },
    status_kamar: {
      type: String,
      enum: {
        values: ['tersedia', 'tidak tersedia'],
        message: 'Status kamar harus "tersedia" atau "tidak tersedia"',
      },
      default: 'tersedia',
      index: true,
    },
    kapasitas: {
      type: Number,
      default: 1,
      min: [1, 'Kapasitas minimal 1'],
    },
    deskripsi: {
      type: String,
      trim: true,
      maxlength: [500, 'Deskripsi maksimal 500 karakter'],
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

// Indexes untuk performa
kamarSchema.index({ nomor_kamar: 1 });
kamarSchema.index({ tipe_kamar: 1 });
kamarSchema.index({ lantai: 1 });
kamarSchema.index({ harga_sewa: 1 });
kamarSchema.index({ status_kamar: 1, isDeleted: 1 });
kamarSchema.index({ createdAt: -1 });

// Virtual untuk penghuni di kamar ini
kamarSchema.virtual('penghuni', {
  ref: 'Penghuni',
  localField: '_id',
  foreignField: 'id_kamar',
  justOne: false,
});

// Query middleware untuk soft delete
kamarSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

const Kamar = mongoose.model('Kamar', kamarSchema);

export default Kamar;
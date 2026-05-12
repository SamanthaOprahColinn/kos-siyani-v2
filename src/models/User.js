// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_ARRAY } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    nama_lengkap: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi'],
      trim: true,
      minlength: [3, 'Nama minimal 3 karakter'],
      maxlength: [100, 'Nama maksimal 100 karakter'],
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
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: [8, 'Password minimal 8 karakter'],
      select: false, // Tidak include password saat query default
    },
    role: {
      type: String,
      enum: {
        values: ROLE_ARRAY,
        message: `Role harus salah satu dari: ${ROLE_ARRAY.join(', ')}`,
      },
      required: [true, 'Role wajib diisi'],
      default: 'penghuni',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index untuk performa query
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// Virtual populate untuk penghuni jika user adalah penghuni
userSchema.virtual('penghuni', {
  ref: 'Penghuni',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true,
});

// Hash password sebelum save
userSchema.pre('save', async function (next) {
  // Hanya hash jika password berubah
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method untuk compare password
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Query middleware untuk soft delete
userSchema.pre(/^find/, function (next) {
  // Exclude soft deleted documents dari query default
  if (this.getOptions().includeDeleted !== true) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
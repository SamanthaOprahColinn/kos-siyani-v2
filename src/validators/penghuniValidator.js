// src/validators/penghuniValidator.js
import Joi from 'joi';
import { PENGHUNI_STATUS_ARRAY } from '../constants/enums.js';

/**
 * Validator untuk create penghuni
 */
export const createPenghuniSchema = Joi.object({
  nama_lengkap: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Nama lengkap tidak boleh kosong',
      'string.min': 'Nama minimal 3 karakter',
      'string.max': 'Nama maksimal 100 karakter',
      'any.required': 'Nama lengkap wajib diisi',
    }),

  no_ktp: Joi.string()
    .required()
    .trim()
    .length(16)
    .pattern(/^\d{16}$/)
    .messages({
      'string.empty': 'Nomor KTP tidak boleh kosong',
      'string.length': 'Nomor KTP harus 16 digit',
      'string.pattern.base': 'Nomor KTP harus 16 digit',
      'any.required': 'Nomor KTP wajib diisi',
    }),

  no_hp: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(13)
    .pattern(/^\d{10,13}$/)
    .messages({
      'string.empty': 'Nomor HP tidak boleh kosong',
      'string.min': 'Nomor HP minimal 10 digit',
      'string.max': 'Nomor HP maksimal 13 digit',
      'string.pattern.base': 'Format nomor HP tidak valid',
      'any.required': 'Nomor HP wajib diisi',
    }),

  email: Joi.string()
    .required()
    .trim()
    .lowercase()
    .email()
    .messages({
      'string.empty': 'Email tidak boleh kosong',
      'string.email': 'Format email tidak valid',
      'any.required': 'Email wajib diisi',
    }),

  alamat_asal: Joi.string()
    .required()
    .trim()
    .min(10)
    .messages({
      'string.empty': 'Alamat asal tidak boleh kosong',
      'string.min': 'Alamat minimal 10 karakter',
      'any.required': 'Alamat asal wajib diisi',
    }),

  id_kamar: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'ID Kamar tidak boleh kosong',
      'string.pattern.base': 'Format ID Kamar tidak valid',
      'any.required': 'ID Kamar wajib diisi',
    }),

  tanggal_masuk: Joi.string()
    .optional()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      'date.base': 'Format tanggal masuk tidak valid',
      'any.required': 'Tanggal masuk wajib diisi',
    }),

  catatan: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Catatan maksimal 500 karakter',
    }),
}).strict();

/**
 * Validator untuk update penghuni
 */
export const updatePenghuniSchema = Joi.object({
  nama_lengkap: Joi.string()
    .optional()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.min': 'Nama minimal 3 karakter',
      'string.max': 'Nama maksimal 100 karakter',
    }),

  no_ktp: Joi.string()
    .optional()
    .trim()
    .length(16)
    .pattern(/^\d{16}$/)
    .messages({
      'string.length': 'Nomor KTP harus 16 digit',
      'string.pattern.base': 'Nomor KTP harus 16 digit',
    }),

  no_hp: Joi.string()
    .optional()
    .trim()
    .min(10)
    .max(13)
    .pattern(/^\d{10,13}$/)
    .messages({
      'string.min': 'Nomor HP minimal 10 digit',
      'string.max': 'Nomor HP maksimal 13 digit',
      'string.pattern.base': 'Format nomor HP tidak valid',
    }),

  email: Joi.string()
    .optional()
    .trim()
    .lowercase()
    .email()
    .messages({
      'string.email': 'Format email tidak valid',
    }),

  alamat_asal: Joi.string()
    .optional()
    .trim()
    .min(10)
    .messages({
      'string.min': 'Alamat minimal 10 karakter',
    }),

  id_kamar: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Format ID Kamar tidak valid',
    }),

  tanggal_masuk: Joi.string()
    .optional()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      'date.base': 'Format tanggal masuk tidak valid',
    }),

  tanggal_keluar: Joi.string()
    .optional()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .messages({
      'date.base': 'Format tanggal keluar tidak valid',
    }),

  status_penghuni: Joi.string()
    .optional()
    .valid(...PENGHUNI_STATUS_ARRAY)
    .messages({
      'any.only': `Status harus salah satu dari: ${PENGHUNI_STATUS_ARRAY.join(', ')}`,
    }),

  keadaan_kamar: Joi.string()
    .optional()
    .valid('baik', 'rusak_ringan', 'rusak_berat')
    .messages({
      'any.only': 'Keadaan kamar harus: baik, rusak_ringan, atau rusak_berat',
    }),

  catatan: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Catatan maksimal 500 karakter',
    }),
}).strict();

/**
 * Middleware untuk validate request body
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validasi gagal',
        errors,
      });
    }

    req.validatedData = value;
    next();
  };
};
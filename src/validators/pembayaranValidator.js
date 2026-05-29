// src/validators/pembayaranValidator.js
import Joi from 'joi';

/**
 * Validator untuk create pembayaran (tagihan)
 */
export const createPembayaranSchema = Joi.object({
  id_penghuni: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Format ID Penghuni tidak valid',
      'any.required': 'ID Penghuni wajib diisi',
    }),

  id_kamar: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Format ID Kamar tidak valid',
      'any.required': 'ID Kamar wajib diisi',
    }),

  bulan_tagihan: Joi.number()
    .required()
    .min(1)
    .max(12)
    .integer()
    .messages({
      'number.base': 'Bulan tagihan harus berupa angka',
      'number.min': 'Bulan minimal 1',
      'number.max': 'Bulan maksimal 12',
      'any.required': 'Bulan tagihan wajib diisi',
    }),

  tahun_tagihan: Joi.number()
    .required()
    .integer()
    .messages({
      'number.base': 'Tahun tagihan harus berupa angka',
      'any.required': 'Tahun tagihan wajib diisi',
    }),

  jumlah_tagihan: Joi.number()
    .required()
    .min(0)
    .messages({
      'number.base': 'Jumlah tagihan harus berupa angka',
      'number.min': 'Jumlah tagihan tidak boleh negatif',
      'any.required': 'Jumlah tagihan wajib diisi',
    }),

  tgl_jatuh_tempo: Joi.string()
  .required()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'date.base': 'Format tanggal jatuh tempo tidak valid',
    'string.pattern.base': 'Format tanggal harus YYYY-MM-DD',
    'any.required': 'Tanggal jatuh tempo wajib diisi',
  }),

  metode_pembayaran: Joi.string()
    .optional()
    .valid('transfer', 'cash', 'e-wallet')
    .messages({
      'any.only': 'Metode pembayaran harus "transfer", "cash", atau "e-wallet"',
    }),
}).strict();

/**
 * Validator untuk update pembayaran
 */
export const updatePembayaranSchema = Joi.object({
  bulan_tagihan: Joi.number()
    .optional()
    .min(1)
    .max(12)
    .integer()
    .messages({
      'number.min': 'Bulan minimal 1',
      'number.max': 'Bulan maksimal 12',
    }),

  tahun_tagihan: Joi.number()
    .optional()
    .integer(),

  jumlah_tagihan: Joi.number()
    .optional()
    .min(0)
    .messages({
      'number.min': 'Jumlah tagihan tidak boleh negatif',
    }),

  tgl_jatuh_tempo: Joi.string()
    .optional()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      'date.base': 'Format tanggal jatuh tempo tidak valid',
      'string.pattern.base': 'Format tanggal harus YYYY-MM-DD',
      'any.required': 'Tanggal jatuh tempo wajib diisi',
    }),



  metode_pembayaran: Joi.string()
    .optional()
    .valid('transfer', 'cash', 'e-wallet')
    .messages({
      'any.only': 'Metode pembayaran harus "transfer", "cash", atau "e-wallet"',
    }),

  catatan_admin: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Catatan admin maksimal 500 karakter',
    }),
}).strict();

/**
 * Validator untuk validasi pembayaran (change status)
 */
export const validatePembayaranSchema = Joi.object({
  status_bayar: Joi.string()
    .required()
    .valid('belum_bayar', 'menunggu_konfirmasi', 'lunas', 'ditolak')
    .messages({
      'any.only':
        'Status pembayaran harus "belum_bayar", "menunggu_konfirmasi", "lunas", atau "ditolak"',
      'any.required': 'Status pembayaran wajib diisi',
    }),

  catatan_admin: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Catatan admin maksimal 500 karakter',
    }),
}).strict();

/**
 * Middleware untuk validate request body
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      convert: true,
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
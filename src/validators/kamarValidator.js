// src/validators/kamarValidator.js
import Joi from 'joi';

/**
 * Validator untuk create kamar
 */
export const createKamarSchema = Joi.object({
  nomor_kamar: Joi.number()
    .required()
    .min(1)
    .max(10)
    .integer()
    .messages({
      'number.base': 'Nomor kamar harus berupa angka',
      'number.min': 'Nomor kamar minimal 1',
      'number.max': 'Nomor kamar maksimal 10',
      'any.required': 'Nomor kamar wajib diisi',
    }),

  lantai: Joi.number()
    .required()
    .valid(1, 2)
    .messages({
      'number.base': 'Lantai harus berupa angka',
      'any.only': 'Lantai hanya boleh 1 atau 2',
      'any.required': 'Lantai wajib diisi',
    }),

  tipe_kamar: Joi.string()
    .required()
    .uppercase()
    .valid('A', 'B', 'C')
    .messages({
      'string.empty': 'Tipe kamar tidak boleh kosong',
      'any.only': 'Tipe kamar harus A, B, atau C',
      'any.required': 'Tipe kamar wajib diisi',
    }),

  harga_sewa: Joi.number()
    .optional()
    .min(0)
    .messages({
      'number.base': 'Harga sewa harus berupa angka',
      'number.min': 'Harga sewa tidak boleh negatif',
    }),

  fasilitas: Joi.array()
    .optional()
    .items(Joi.string().trim())
    .min(1)
    .messages({
      'array.min': 'Fasilitas minimal 1 item',
    }),

  kapasitas: Joi.number()
    .optional()
    .min(1)
    .integer()
    .messages({
      'number.base': 'Kapasitas harus berupa angka',
      'number.min': 'Kapasitas minimal 1',
    }),

  deskripsi: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Deskripsi maksimal 500 karakter',
    }),
}).strict();

/**
 * Validator untuk update kamar
 */
export const updateKamarSchema = Joi.object({
  nomor_kamar: Joi.number()
    .optional()
    .min(1)
    .max(10)
    .integer()
    .messages({
      'number.min': 'Nomor kamar minimal 1',
      'number.max': 'Nomor kamar maksimal 10',
    }),

  lantai: Joi.number()
    .optional()
    .valid(1, 2)
    .messages({
      'any.only': 'Lantai hanya boleh 1 atau 2',
    }),

  tipe_kamar: Joi.string()
    .optional()
    .uppercase()
    .valid('A', 'B', 'C')
    .messages({
      'any.only': 'Tipe kamar harus A, B, atau C',
    }),

  harga_sewa: Joi.number()
    .optional()
    .min(0)
    .messages({
      'number.min': 'Harga sewa tidak boleh negatif',
    }),

  fasilitas: Joi.array()
    .optional()
    .items(Joi.string().trim())
    .min(1)
    .messages({
      'array.min': 'Fasilitas minimal 1 item',
    }),

  kapasitas: Joi.number()
    .optional()
    .min(1)
    .integer()
    .messages({
      'number.min': 'Kapasitas minimal 1',
    }),

  deskripsi: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Deskripsi maksimal 500 karakter',
    }),

  status_kamar: Joi.string()
    .optional()
    .valid('tersedia', 'tidak tersedia')
    .messages({
      'any.only': 'Status kamar harus "tersedia" atau "tidak tersedia"',
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
// src/validators/authValidator.js
import Joi from 'joi';
import { ROLE_ARRAY } from '../constants/enums.js';

/**
 * Validator untuk login
 */
export const loginSchema = Joi.object({
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

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password tidak boleh kosong',
      'any.required': 'Password wajib diisi',
    }),
}).strict();

/**
 * Validator untuk create admin oleh admin/pemilik
 */
export const createAdminSchema = Joi.object({
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

  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.empty': 'Password tidak boleh kosong',
      'string.min': 'Password minimal 8 karakter',
      'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
      'any.required': 'Password wajib diisi',
    }),

  role: Joi.string()
    .required()
    .valid('admin', 'pemilik')
    .messages({
      'any.only': 'Role harus admin atau pemilik',
      'any.required': 'Role wajib diisi',
    }),
}).strict();

/**
 * CHANGE PASSWORD - User ubah password mereka sendiri
 */
export const changePasswordSchema = Joi.object({
  password_lama: Joi.string()
    .required()
    .messages({
      'any.required': 'Password lama wajib diisi',
      'string.empty': 'Password lama tidak boleh kosong',
    }),

  password_baru: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password minimal 8 karakter',
      'string.pattern.base':
        'Password harus mengandung: huruf kecil, HURUF BESAR, angka, dan simbol (@$!%*?&)',
      'any.required': 'Password baru wajib diisi',
    }),

  konfirmasi_password: Joi.string()
    .valid(Joi.ref('password_baru'))
    .required()
    .messages({
      'any.only': 'Konfirmasi password harus sama dengan password baru',
      'any.required': 'Konfirmasi password wajib diisi',
    }),
}).unknown(false);

/**
 * MIDDLEWARE: Validasi request
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validasi gagal',
        errors: messages,
      });
    }

    req.validatedData = value;
    next();
  };
};
// src/config/multer.js
import multer from 'multer';

/**
 * STORAGE: Memory storage (tidak disimpan ke disk)
 * File disimpan di memory, kemudian convert ke base64
 */
const storage = multer.memoryStorage();

/**
 * FILE FILTER - VALIDASI FILE
 */
const fileFilter = (req, file, cb) => {
  // Allowed mime types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  // Check mime type
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(
      new Error('Format file tidak valid. Hanya JPG, JPEG, PNG yang diperbolehkan.')
    );
  }

  cb(null, true);
};

/**
 * MULTER MIDDLEWARE - Upload ke memory
 */
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB (untuk base64 ~2.3MB image)
  },
});

/**
 * ERROR HANDLER UNTUK UPLOAD
 */
export const handleUploadError = (err, req, res, next) => {
  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Ukuran file terlalu besar. Maksimal 3MB.',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Hanya 1 file yang dapat di-upload.',
      });
    }

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Upload error: ${err.message}`,
    });
  }

  // File validation errors
  if (err) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: err.message,
    });
  }

  next();
};

/**
 * CONVERT FILE TO BASE64
 * File dari memory buffer dikonversi ke base64 string
 */
export const convertToBase64 = (file) => {
  if (!file) {
    return null;
  }

  // Format: data:image/jpeg;base64,...
  const base64String = file.buffer.toString('base64');
  const mimeType = file.mimetype;
  
  return `data:${mimeType};base64,${base64String}`;
};

/**
 * GET FILE INFO
 */
export const getFileInfo = (file) => {
  if (!file) {
    return null;
  }

  return {
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
};
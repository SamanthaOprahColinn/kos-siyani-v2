// src/utils/ApiResponse.js

/**
 * Standardisasi response API
 * Format:
 * {
 *   "success": true/false,
 *   "statusCode": 200,
 *   "message": "...",
 *   "data": {...}
 * }
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

/**
 * Utility untuk membuat response success
 */
export const successResponse = (res, statusCode, data, message = 'Success') => {
  return res.status(statusCode).json(
    new ApiResponse(statusCode, data, message)
  );
};

/**
 * Utility untuk membuat response error
 */
export const errorResponse = (res, statusCode, message = 'Error', data = null) => {
  return res.status(statusCode).json(
    new ApiResponse(statusCode, data, message)
  );
};
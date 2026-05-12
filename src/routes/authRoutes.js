// src/routes/authRoutes.js
import express from 'express';
import {
  login,
  createAdmin,
  getCurrentUser,
  getAllUsers,
  deactivateUser,
  activateUser,
  deleteUser,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authentication.js';
import { authorizeRoles } from '../middlewares/authorization.js';
import { validateRequest, loginSchema, createAdminSchema } from '../validators/authValidator.js';

const router = express.Router();

/**
 * Public routes
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * Protected routes
 */
router.get('/me', protect, getCurrentUser);

/**
 * Admin & Pemilik routes
 */
router.post(
  '/create-admin',
  protect,
  authorizeRoles('pemilik', 'admin'),
  validateRequest(createAdminSchema),
  createAdmin
);

/**
 * Pemilik only routes
 */
router.get('/users', protect, authorizeRoles('pemilik'), getAllUsers);

router.patch(
  '/users/:id/deactivate',
  protect,
  authorizeRoles('pemilik'),
  deactivateUser
);

router.patch(
  '/users/:id/activate',
  protect,
  authorizeRoles('pemilik'),
  activateUser
);

router.delete(
  '/users/:id',
  protect,
  authorizeRoles('pemilik'),
  deleteUser
);

export default router;
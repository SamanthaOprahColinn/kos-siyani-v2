import express from 'express';
import { getStats as getKamarStats } from '../controllers/kamarController.js';
import { getStats as getPenghuniStats } from '../controllers/penghuniController.js';

const router = express.Router();

router.get('/stats/kamar', getKamarStats);
router.get('/stats/penghuni', getPenghuniStats);

export default router;

import express from 'express';
import { createAd, getAllAds, getAdById, updateAd, deleteAd, deleteMultipleAds } from '../controller/ad.controller.ts';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';

const router = express.Router();

// Admin-only endpoints - use both authenticate (to decode token) and requireAdmin (to check admin role)
router.post('/', authenticate, requireAdmin, createAd);
router.put('/:id', authenticate, requireAdmin, updateAd);
router.delete('/:id', authenticate, requireAdmin, deleteAd);
router.post('/bulk-delete', authenticate, requireAdmin, deleteMultipleAds);

// Public endpoints
router.get('/', getAllAds);
router.get('/:id', getAdById);

export default router;
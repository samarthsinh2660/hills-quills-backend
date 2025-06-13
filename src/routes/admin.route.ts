import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';
import { updateAdminProfile } from '../controller/admin.controller.ts';
import { getAllAuthors,getAuthorById,adminUpdateAuthorProfile } from '../controller/admin.controller.ts';

const adminRouter = Router();
adminRouter.put('/admin/profile', authenticate, requireAdmin, updateAdminProfile);

// Admin Routes for Author Management
adminRouter.get('/admin/authors', authenticate, requireAdmin, getAllAuthors);
adminRouter.get('/admin/authors/:authorId', authenticate, requireAdmin, getAuthorById);
adminRouter.put('/admin/authors/:authorId', authenticate, requireAdmin, adminUpdateAuthorProfile);

export default adminRouter;

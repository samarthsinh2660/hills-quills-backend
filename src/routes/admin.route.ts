import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';
import { 
    updateAdminProfile, 
    getAllAuthors, 
    getAuthorById, 
    adminUpdateAuthorProfile,
    updateAuthorStatus,
    deleteAuthor
} from '../controller/admin.controller.ts';

const adminRouter = Router();
adminRouter.put('/profile', authenticate, requireAdmin, updateAdminProfile);

// Admin Routes for Author Management
adminRouter.get('/authors', authenticate, requireAdmin, getAllAuthors);
adminRouter.get('/authors/:authorId', authenticate, requireAdmin, getAuthorById);
adminRouter.put('/authors/:authorId', authenticate, requireAdmin, adminUpdateAuthorProfile);
adminRouter.patch('/authors/:authorId/status', authenticate, requireAdmin, updateAuthorStatus);
adminRouter.delete('/authors/:authorId', authenticate, requireAdmin, deleteAuthor);

export default adminRouter;

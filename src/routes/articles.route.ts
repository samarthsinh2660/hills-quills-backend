import { Router } from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  submitArticle,
  approveArticle,
  rejectArticle,
  markTopNews,
  unmarkTopNews,
  searchArticles,
  getTrendingArticles,
  bulkDeleteArticles,
  bulkApproveArticles,
  bulkRejectArticles,
  bulkMarkTopNews,
  bulkUnmarkTopNews
} from '../controller/article.controller.ts';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';

const articleRouter = Router();

// Author/Admin Article Management Routes
articleRouter.post('/', authenticate, createArticle);
articleRouter.get('/', authenticate, getArticles);
articleRouter.get('/search', authenticate, searchArticles);
articleRouter.get('/trending', authenticate, getTrendingArticles);
articleRouter.get('/:id', authenticate, getArticleById);
articleRouter.put('/:id', authenticate, updateArticle);
articleRouter.delete('/:id', authenticate, deleteArticle);

// Article Workflow Routes
articleRouter.post('/:id/submit', authenticate, submitArticle);

// Admin Only Routes
const adminRouter = Router();

// Bulk Operations (Admin Only) 
adminRouter.post('/bulk/delete', authenticate, requireAdmin, bulkDeleteArticles);
adminRouter.post('/bulk/approve', authenticate, requireAdmin, bulkApproveArticles);
adminRouter.post('/bulk/reject', authenticate, requireAdmin, bulkRejectArticles);
adminRouter.post('/bulk/top', authenticate, requireAdmin, bulkMarkTopNews);
adminRouter.delete('/bulk/top', authenticate, requireAdmin, bulkUnmarkTopNews);

// Individual Article Operations (Admin Only)
adminRouter.post('/:id/approve', authenticate, requireAdmin, approveArticle);
adminRouter.post('/:id/reject', authenticate, requireAdmin, rejectArticle);
adminRouter.post('/:id/top', authenticate, requireAdmin, markTopNews);
adminRouter.delete('/:id/top', authenticate, requireAdmin, unmarkTopNews);

// Mount admin routes
articleRouter.use('/admin', adminRouter);

export default articleRouter;
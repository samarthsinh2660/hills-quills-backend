import { Router } from 'express';
import {
  getPublicArticles,
  getPublicArticleById,
  getTopNews,
  searchPublicArticles,
  getPublicTrendingArticles,
  getTrendingTags,
  getArticlesByRegion,
  getCultureHeritageArticles,
  getFromDistrictsArticles,
  getMoreStories,
  getArticlesByCategory,
  getRecentArticles,
  getPublicArticlesByTags,
  getFeaturedArticles
} from '../controller/public.controller.ts';

const publicRouter = Router();

// Public Article Routes - All return only approved articles
publicRouter.get('/articles', getPublicArticles);
publicRouter.get('/articles/recent', getRecentArticles);
publicRouter.get('/articles/search', searchPublicArticles);
publicRouter.get('/articles/trending', getPublicTrendingArticles);
publicRouter.get('/articles/trending/tags', getTrendingTags);
publicRouter.get('/articles/top', getTopNews);
publicRouter.get('/articles/more-stories', getMoreStories);
publicRouter.get('/articles/by-tags', getPublicArticlesByTags);
publicRouter.get('/articles/featured', getFeaturedArticles);

// Category-specific routes
publicRouter.get('/articles/culture-heritage', getCultureHeritageArticles);
publicRouter.get('/articles/category/:category', getArticlesByCategory);

// Region-specific routes
publicRouter.get('/articles/region/:region', getArticlesByRegion);

// From Districts routes
publicRouter.get('/articles/from-districts', getFromDistrictsArticles);
publicRouter.get('/articles/from-districts/:district', getFromDistrictsArticles);

// Single article route (with view count increment)
publicRouter.get('/articles/:id', getPublicArticleById);

export default publicRouter;
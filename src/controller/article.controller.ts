import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service.ts';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.ts';
import { ERRORS } from '../utils/error.ts';
import { 
  validateArticleCategory, 
  validateUttarakhandRegion,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleFilters,
  SearchParams,
  TrendingParams
} from '../models/article.model.ts';

const articleService = new ArticleService();

// Create article (Authors only)
export const createArticle = async (req: Request, res: Response) => {
  try {

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      throw ERRORS.NO_TOKEN_PROVIDED;
    }


    const { title, description, content, category, region }: CreateArticleRequest = req.body;
    
    // Validation
    if (!title || !content || !category) {
      res.status(400).json(errorResponse("Title, content, and category are required", 50005));
      return;
    }
    
    if (!validateArticleCategory(category)) {
      res.status(400).json(errorResponse("Invalid category", 50005));
      return;
    }
    
    if (region && !validateUttarakhandRegion(region)) {
      res.status(400).json(errorResponse("Invalid region", 50005));
      return;
    }
    
    const article = await articleService.createArticle(req.user!.id, {
      title,
      description,
      content,
      category,
      region
    });
    
    res.status(201).json(successResponse(article, "Article created successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Get all articles with filters (Admin/Author dashboard)
export const getArticles = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: req.query.status as any,
      category: req.query.category as string,
      region: req.query.region as string,
      author_id: req.query.author_id ? parseInt(req.query.author_id as string) : undefined,
       is_top_news: req.query.is_top_news ? req.query.is_top_news === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any || 'created_at',
      sortOrder: req.query.sortOrder as any || 'DESC'
    };
    
    // Authors can only see their own articles unless admin
    if (!req.user!.is_admin) {
      filters.author_id = req.user!.id;
    }
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Get single article by ID
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.getArticleById(id);
    
    // Authors can only see their own articles unless admin
    if (!req.user!.is_admin && article.author_id !== req.user!.id) {
      res.status(403).json(errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.code));
      return;
    }
    
    res.json(successResponse(article, "Article retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Update article
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updateData: UpdateArticleRequest = req.body;
    
    // Validate category if provided
    if (updateData.category && !validateArticleCategory(updateData.category)) {
      res.status(400).json(errorResponse("Invalid category", 50005));
      return;
    }
    
    // Validate region if provided
    if (updateData.region && !validateUttarakhandRegion(updateData.region)) {
      res.status(400).json(errorResponse("Invalid region", 50005));
      return;
    }
    
    const article = await articleService.updateArticle(id, req.user!.id, req.user!.is_admin, updateData);
    
    res.json(successResponse(article, "Article updated successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Delete article
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await articleService.deleteArticle(id, req.user!.id, req.user!.is_admin);
    
    res.json(successResponse(null, "Article deleted successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Submit article for approval
export const submitArticle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.submitArticle(id, req.user!.id);
    
    res.json(successResponse(article, "Article submitted for approval"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Admin approve article
export const approveArticle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.approveArticle(id);
    
    res.json(successResponse(article, "Article approved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Admin reject article
export const rejectArticle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.rejectArticle(id);
    
    res.json(successResponse(article, "Article rejected"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Mark as top news
export const markTopNews = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.markAsTopNews(id);
    
    res.json(successResponse(article, "Article marked as top news"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Unmark as top news
export const unmarkTopNews = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.unmarkAsTopNews(id);
    
    res.json(successResponse(article, "Article unmarked as top news"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Search articles
export const searchArticles = async (req: Request, res: Response) => {
  try {
    const searchParams: SearchParams = {
      query: req.query.query as string || '',
      category: req.query.category as string,
      region: req.query.region as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };
    
    if (!searchParams.query.trim()) {
      res.status(400).json(errorResponse("Search query is required", 50005));
      return;
    }
    
    const result = await articleService.searchArticles(searchParams);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Search results retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Get trending articles
export const getTrendingArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const validTimeframes = ['day', 'week', 'month'];
    const timeframe = req.query.timeframe as string;
    
    if (timeframe && !validTimeframes.includes(timeframe)) {
      res.status(400).json(errorResponse('Invalid timeframe. Must be one of: day, week, month', 400));
      return;
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse('Page must be greater than 0', 400));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse('Limit must be between 1 and 100', 400));
      return;
    }
    
    const params: TrendingParams = {
      timeframe: (timeframe as any) || 'week',
      page,
      limit
    };
    
    const result = await articleService.getTrendingArticles(params);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Trending articles retrieved successfully"));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Internal server error';
    
    res.status(statusCode).json(errorResponse(message, errorCode));
  }
};

// Bulk Operations (Admin only)

// Bulk delete articles
export const bulkDeleteArticles = async (req: Request, res: Response) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkDeleteArticles(ids);
    
    res.json(successResponse(null, "Articles deleted successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Bulk approve articles
export const bulkApproveArticles = async (req: Request, res: Response) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkApproveArticles(ids);
    
    res.json(successResponse(null, "Articles approved successfully"));
    
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Bulk reject articles
export const bulkRejectArticles = async (req: Request, res: Response) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkRejectArticles(ids);
    
    res.json(successResponse(null, "Articles rejected successfully"));
    
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Bulk mark as top news
export const bulkMarkTopNews = async (req: Request, res: Response) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkMarkAsTopNews(ids);
    
    res.json(successResponse(null, "Articles marked as top news successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Bulk unmark as top news
export const bulkUnmarkTopNews = async (req: Request, res: Response) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkUnmarkAsTopNews(ids);
    
    res.json(successResponse(null, "Articles unmarked as top news successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};
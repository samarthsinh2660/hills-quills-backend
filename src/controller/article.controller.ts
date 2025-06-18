import { NextFunction, Request, Response } from 'express';
import { ArticleService } from '../services/article.service.ts';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.ts';
import { ERRORS } from '../utils/error.ts';
import { 
  validateArticleCategory, 
  validateUttarakhandRegion,
  validateTags,
  sanitizeTags,
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

    const { title, description, content, category, region, tags, image }: CreateArticleRequest = req.body;
    
    // Validation
    if (!title || !content || !category) {
      res.status(400).json(errorResponse("Title, content, and category are required", 50005));
      return;
    }
    
    // Image is required for creating new articles
    if (!image) {
      res.status(400).json(errorResponse("Image is required for creating articles", 50005));
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

    // Validate and sanitize tags
    let sanitizedTags: string[] = [];
    if (tags && tags.length > 0) {
      if (!validateTags(tags)) {
        res.status(400).json(errorResponse("Invalid tags. Tags must be 2-30 characters long, maximum 10 tags allowed", 50005));
        return;
      }
      sanitizedTags = sanitizeTags(tags);
    }
    
    const article = await articleService.createArticle(req.user!.id, {
      title,
      description,
      content,
      category,
      region,
      tags: sanitizedTags.length > 0 ? sanitizedTags : undefined,
      image
    });
    
    res.status(201).json(successResponse(article, "Article created successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};

// Get all articles with filters (Admin/Author dashboard)
export const getArticles = async (req: Request, res: Response) => {
  try {
    let tags: string[] = [];
    if (req.query.tags) {
      if (typeof req.query.tags === 'string') {
        tags = req.query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      }
    }

    const filters: ArticleFilters = {
      status: req.query.status as any,
      category: req.query.category as string,
      region: req.query.region as string,
      author_id: req.query.author_id ? parseInt(req.query.author_id as string) : undefined,
      is_top_news: req.query.is_top_news ? req.query.is_top_news === 'true' : undefined,
      tags: tags.length > 0 ? tags : undefined,
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

    // Validate and sanitize tags if provided
    if (updateData.tags !== undefined) {
      if (updateData.tags && updateData.tags.length > 0) {
        if (!validateTags(updateData.tags)) {
          res.status(400).json(errorResponse("Invalid tags. Tags must be 2-30 characters long, maximum 10 tags allowed", 50005));
          return;
        }
        updateData.tags = sanitizeTags(updateData.tags);
      } else {
        updateData.tags = [];
      }
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
    const { reason } = req.body;
    
    await articleService.rejectArticle(id, reason);
    
    res.json(successResponse(null, "Article rejected successfully"));
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
    let tags: string[] = [];
    if (req.query.tags) {
      if (typeof req.query.tags === 'string') {
        tags = req.query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      }
    }

    const searchParams: SearchParams = {
      query: req.query.query as string || '',
      category: req.query.category as string,
      region: req.query.region as string,
      tags: tags.length > 0 ? tags : undefined,
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
    
    // Add authorId logic
    const authorId = req.query.author_id ? 
      parseInt(req.query.author_id as string) : 
      (req.query.author_only === 'true' ? req.user?.id : undefined);
    
    const params: TrendingParams = {
      timeframe: req.query.timeframe as any || 'week',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };
    
    const result = await articleService.getTrendingArticles(params, authorId);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Trending articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
  }
};
// Get articles by tags
export const getArticlesByTags = async (req: Request, res: Response) => {
  try {
    let tags: string[] = [];
    if (req.query.tags) {
      if (typeof req.query.tags === 'string') {
        tags = req.query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      }
    }

    if (tags.length === 0) {
      res.status(400).json(errorResponse("At least one tag is required", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: req.query.status as any,
      tags: tags,
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
    
    res.json(paginatedResponse(result.articles, result.pagination, `Articles with tags [${tags.join(', ')}] retrieved successfully`));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
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
    const { ids, reason }: { ids: number[], reason?: string } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(errorResponse("Article IDs array is required", 50005));
      return;
    }
    
    await articleService.bulkRejectArticles(ids, reason);
    
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

export const getPendingArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const user = req.user!;
      
      // Only admins can access this endpoint
      if (!user.is_admin) {
          throw ERRORS.UNAUTHORIZED;
      }

      const { page = 1, limit = 10 } = req.query;
      
      // Create filters specifically for pending articles
      const filters = {
          status: 'pending' as const,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: 'created_at' as const,
          sortOrder: 'DESC' as 'DESC' | 'ASC'
      };

      const articleService = new ArticleService();
      const result = await articleService.getArticles(filters);
      
      res.json(
          successResponse({
              articles: result.articles,
              pagination: result.pagination
          }, "Pending articles retrieved successfully")
      );
  } catch (error) {
      next(error);
  }
};

// Get details of a specific pending article
export const getPendingArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const user = req.user!;
      
      // Only admins can access this endpoint
      if (!user.is_admin) {
          throw ERRORS.UNAUTHORIZED;
      }

      const { articleId } = req.params;
      const articleService = new ArticleService();
      
      const article = await articleService.getArticleById(parseInt(articleId));
      
      // Verify this is actually a pending article
      if (article.status !== 'pending') {
          throw ERRORS.VALIDATION_ERROR;
      }
      
      res.json(
          successResponse(article, "Pending article details retrieved successfully")
      );
  } catch (error) {
      next(error);
  }
};
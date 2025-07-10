import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service.ts';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.ts';
import { ArticleFilters, TrendingParams, validateUttarakhandRegion, validateArticleCategory } from '../models/article.model.ts';

const articleService = new ArticleService();

// Get all approved articles for public (website frontend)
export const getPublicArticles = async (req: Request, res: Response) => {
  try {
    // Parse tags properly
    let tags: string[] = [];
    if (req.query.tags) {
      if (typeof req.query.tags === 'string') {
        tags = req.query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      }
    }

    // Validate pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    // Validate category if provided
    const category = req.query.category as string;
    if (category && !validateArticleCategory(category)) {
      res.status(400).json(errorResponse("Invalid category", 50005));
      return;
    }

    // Validate region if provided
    const region = req.query.region as string;
    if (region && !validateUttarakhandRegion(region)) {
      res.status(400).json(errorResponse("Invalid region", 50005));
      return;
    }

    // Type-safe sort parameters
    const sortBy = req.query.sortBy as ArticleFilters['sortBy'] || 'publish_date';
    const sortOrder = req.query.sortOrder as ArticleFilters['sortOrder'] || 'DESC';

    const filters: ArticleFilters = {
      status: 'approved', // Only approved articles
      category: category,
      region: region,
      // Only add is_top_news to filters if it's explicitly in the query
      ...(req.query.is_top_news !== undefined && { is_top_news: req.query.is_top_news === 'true' }),
      tags: tags.length > 0 ? tags : undefined,
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Articles retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get single approved article by ID for public
export const getPublicArticleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      res.status(400).json(errorResponse("Invalid article ID", 50005));
      return;
    }
    
    const article = await articleService.getArticleById(id);
    
    // Only return approved articles to public
    if (article.status !== 'approved') {
      res.status(404).json(errorResponse("Article not found", 50001));
      return;
    }
    
    // Increment view count
    await articleService.incrementViews(id);
    
    res.json(successResponse(article, "Article retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get top news articles for public
export const getTopNews = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      is_top_news: true,
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Top news retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Search approved articles for public
export const searchPublicArticles = async (req: Request, res: Response) => {
  try {
    const search = req.query.query as string;
    
    if (!search || !search.trim()) {
      res.status(400).json(errorResponse("Search query is required", 50005));
      return;
    }

    // Validate search query length
    if (search.trim().length < 2) {
      res.status(400).json(errorResponse("Search query must be at least 2 characters long", 50005));
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    // Validate category and region if provided
    const category = req.query.category as string;
    const region = req.query.region as string;
    
    if (category && !validateArticleCategory(category)) {
      res.status(400).json(errorResponse("Invalid category", 50005));
      return;
    }
    
    if (region && !validateUttarakhandRegion(region)) {
      res.status(400).json(errorResponse("Invalid region", 50005));
      return;
    }

    // Parse tags properly
    let tags: string[] = [];
    if (req.query.tags) {
      if (typeof req.query.tags === 'string') {
        tags = req.query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      }
    }

    // Use ArticleFilters instead of SearchParams
    const filters: ArticleFilters = {
      status: 'approved', // Only approved articles for public
      category: category,
      region: region,
      tags: tags.length > 0 ? tags : undefined,
      page: page,
      limit: limit,
      search: search.trim(), // Use the consolidated search parameter
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    // Use the findWithSearch method which supports both filtering and searching
    const result = await articleService.findWithSearch(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Search results retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get trending articles for public
export const getPublicTrendingArticles = async (req: Request, res: Response) => {
  try {
    const validTimeframes = ['day', 'week', 'month'];
    const timeframe = req.query.timeframe as string;
    
    if (timeframe && !validTimeframes.includes(timeframe)) {
      res.status(400).json(errorResponse('Invalid timeframe. Must be one of: day, week, month', 50005));
      return;
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse('Page must be greater than 0', 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse('Limit must be between 1 and 100', 50005));
      return;
    }

    const params: TrendingParams = {
      timeframe: (timeframe as TrendingParams['timeframe']) || 'week',
      page: page,
      limit: limit
    };
    
    const result = await articleService.getTrendingArticles(params);
    
    
    res.json(paginatedResponse(result.articles, result.pagination, "Trending articles retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get trending tags for public
export const getTrendingTags = async (req: Request, res: Response) => {
  try {
    const validTimeframes = ['day', 'week', 'month'];
    const timeframe = req.query.timeframe as string;
    
    if (timeframe && !validTimeframes.includes(timeframe)) {
      res.status(400).json(errorResponse('Invalid timeframe. Must be one of: day, week, month', 50005));
      return;
    }

    const params: TrendingParams = {
      timeframe: (timeframe as TrendingParams['timeframe']) || 'week'
    };
    
    const tags = await articleService.getTrendingTags(params);
    
    res.json(successResponse(tags, "Trending tags retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get articles by region for public
export const getArticlesByRegion = async (req: Request, res: Response) => {
  try {
    const region = req.params.region;
    
    if (!region || !validateUttarakhandRegion(region)) {
      res.status(400).json(errorResponse("Invalid region", 50005));
      return;
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      region: region,
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, `Articles from ${region} retrieved successfully`));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get articles by category for public
export const getArticlesByCategory = async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    
    if (!category || !validateArticleCategory(category)) {
      res.status(400).json(errorResponse("Invalid category", 50005));
      return;
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      category: category,
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, `${category} articles retrieved successfully`));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get Culture & Heritage articles
export const getCultureHeritageArticles = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      category: 'Culture & Heritage',
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Culture & Heritage articles retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get From Districts articles
export const getFromDistrictsArticles = async (req: Request, res: Response) => {
  try {
    const district = req.params.district;
    
    // Validate district if provided
    if (district && !validateUttarakhandRegion(district)) {
      res.status(400).json(errorResponse("Invalid district", 50005));
      return;
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      category: 'From Districts',
      region: district || undefined,
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    const message = district 
      ? `Articles from ${district} district retrieved successfully`
      : "From Districts articles retrieved successfully";
    
    res.json(paginatedResponse(result.articles, result.pagination, message));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get more stories for infinite scroll
export const getMoreStories = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6; // Default 6 for infinite scroll
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 50) { // Reduced max limit for infinite scroll
      res.status(400).json(errorResponse("Limit must be between 1 and 50", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      page: page,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "More stories retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get recent articles (homepage)
export const getRecentArticles = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    const filters: ArticleFilters = {
      status: 'approved',
      page: 1,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(successResponse(result.articles, "Recent articles retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get articles by multiple tags for public
export const getPublicArticlesByTags = async (req: Request, res: Response) => {
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

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (page < 1) {
      res.status(400).json(errorResponse("Page must be greater than 0", 50005));
      return;
    }
    
    if (limit < 1 || limit > 100) {
      res.status(400).json(errorResponse("Limit must be between 1 and 100", 50005));
      return;
    }

    // Type-safe sort parameters
    const sortBy = req.query.sortBy as ArticleFilters['sortBy'] || 'publish_date';
    const sortOrder = req.query.sortOrder as ArticleFilters['sortOrder'] || 'DESC';

    const filters: ArticleFilters = {
      status: 'approved', // Only approved articles for public
      tags: tags,
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder
    };

    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, `Articles with tags [${tags.join(', ')}] retrieved successfully`));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};

// Get featured articles (could be top news + high view count)
export const getFeaturedArticles = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    if (limit < 1 || limit > 20) {
      res.status(400).json(errorResponse("Limit must be between 1 and 20", 50005));
      return;
    }

    // First try to get top news, then fall back to high view count articles
    const topNewsFilters: ArticleFilters = {
      status: 'approved',
      is_top_news: true,
      page: 1,
      limit: limit,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(topNewsFilters);
    
    // If not enough top news, supplement with high view count articles
    if (result.articles.length < limit) {
      const remainingLimit = limit - result.articles.length;
      const highViewFilters: ArticleFilters = {
        status: 'approved',
        page: 1,
        limit: remainingLimit,
        sortBy: 'views_count',
        sortOrder: 'DESC'
      };
      
      const highViewResult = await articleService.getArticles(highViewFilters);
      
      // Combine and remove duplicates
      const topNewsIds = new Set(result.articles.map(article => article.id));
      const additionalArticles = highViewResult.articles.filter(article => !topNewsIds.has(article.id));
      
      result.articles = [...result.articles, ...additionalArticles];
    }
    
    res.json(successResponse(result.articles.slice(0, limit), "Featured articles retrieved successfully"));
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number; code?: string | number; message: string };
    const errorCode = typeof errorObj.code === 'number' ? errorObj.code : (errorObj.code ? parseInt(errorObj.code) || 10000 : 10000);
    res.status(errorObj.statusCode || 500).json(errorResponse(errorObj.message, errorCode));
  }
};
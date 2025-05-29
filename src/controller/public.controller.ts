import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service.ts';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.ts';
import { ArticleFilters, SearchParams, TrendingParams } from '../models/article.model.ts';

const articleService = new ArticleService();

// Get all approved articles for public (website frontend)
export const getPublicArticles = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: 'approved', // Only approved articles
      category: req.query.category as string,
      region: req.query.region as string,
      is_top_news: req.query.is_top_news === 'true',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any || 'publish_date',
      sortOrder: req.query.sortOrder as any || 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get single approved article by ID for public
export const getPublicArticleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await articleService.getArticleById(id);
    
    // Only return approved articles to public
    if (article.status !== 'approved') {
      res.status(404).json(errorResponse("Article not found", 50001));
      return;
    }
    
    // Increment view count
    await articleService.incrementViews(id);
    
    res.json(successResponse(article, "Article retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get top news articles for public
export const getTopNews = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: 'approved',
      is_top_news: true,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Top news retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Search approved articles for public
export const searchPublicArticles = async (req: Request, res: Response) => {
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
    return;
  }
};

// Get trending articles for public
export const getPublicTrendingArticles = async (req: Request, res: Response) => {
  try {
    const params: TrendingParams = {
      timeframe: req.query.timeframe as any || 'week',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };
    
    const result = await articleService.getTrendingArticles(params);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Trending articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get articles by region for public
export const getArticlesByRegion = async (req: Request, res: Response) => {
  try {
    const region = req.params.region;
    
    const filters: ArticleFilters = {
      status: 'approved',
      region: region,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, `Articles from ${region} retrieved successfully`));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get Culture & Heritage articles
export const getCultureHeritageArticles = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: 'approved',
      category: 'Culture & Heritage',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "Culture & Heritage articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get From Districts articles
export const getFromDistrictsArticles = async (req: Request, res: Response) => {
  try {
    const district = req.params.district;
    
    const filters: ArticleFilters = {
      status: 'approved',
      category: 'From Districts',
      region: district || undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    const message = district 
      ? `Articles from ${district} district retrieved successfully`
      : "From Districts articles retrieved successfully";
    
    res.json(paginatedResponse(result.articles, result.pagination, message));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get more stories for infinite scroll
export const getMoreStories = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: 'approved',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 6, // Default 6 for infinite scroll
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, "More stories retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get latest articles by category
export const getArticlesByCategory = async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    
    const filters: ArticleFilters = {
      status: 'approved',
      category: category,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(paginatedResponse(result.articles, result.pagination, `${category} articles retrieved successfully`));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};

// Get recent articles (homepage)
export const getRecentArticles = async (req: Request, res: Response) => {
  try {
    const filters: ArticleFilters = {
      status: 'approved',
      page: 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: 'publish_date',
      sortOrder: 'DESC'
    };
    
    const result = await articleService.getArticles(filters);
    
    res.json(successResponse(result.articles, "Recent articles retrieved successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(errorResponse(error.message, error.code));
    return;
  }
};
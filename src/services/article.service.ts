import { 
  Article, 
  ArticleWithAuthor, 
  CreateArticleRequest, 
  UpdateArticleRequest, 
  ArticleFilters, 
  TrendingParams,
  PaginationInfo
} from '../models/article.model.ts';
import { ERRORS } from '../utils/error.ts';
import { IArticleRepository, ArticleRepository } from '../repositories/article.repository.ts';

export class ArticleService {
  private articleRepository: IArticleRepository;

  constructor(articleRepository?: IArticleRepository) {
    this.articleRepository = articleRepository || new ArticleRepository();
  }
  
  // Create new article (author only)
  async createArticle(authorId: number, articleData: CreateArticleRequest): Promise<Article> {
    try {
      return await this.articleRepository.create(authorId, articleData);
    } catch (error) {
      throw ERRORS.ARTICLE_CREATION_FAILED;
    }
  }

  // Get article by ID with author info
  async getArticleById(id: number): Promise<ArticleWithAuthor> {
    try {
      const article = await this.articleRepository.findById(id);
      
      if (!article) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      return article;
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND) throw error;
      throw ERRORS.DATABASE_ERROR;
    }
  }

  // Update article (author can edit draft/rejected, admin can edit any)
  async updateArticle(id: number, userId: number, isAdmin: boolean, updateData: UpdateArticleRequest): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      // Authorization check
      if (!isAdmin && article.author_id !== userId) {
        throw ERRORS.FORBIDDEN;
      }
      
      // Status check for authors
      if (!isAdmin && !['draft', 'rejected'].includes(article.status)) {
        throw ERRORS.FORBIDDEN;
      }
      
      // Check if there are actual updates to make
      const hasUpdates = Object.keys(updateData).some(key => updateData[key as keyof UpdateArticleRequest] !== undefined);
      
      if (!hasUpdates) {
        return article;
      }
      
      await this.articleRepository.update(id, updateData);
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.FORBIDDEN) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Delete article
  async deleteArticle(id: number, userId: number, isAdmin: boolean): Promise<void> {
    try {
      const article = await this.getArticleById(id);
      
      // Authorization: admin can delete any article, authors can only delete their own
      if (!isAdmin && article.author_id !== userId) {
        throw ERRORS.FORBIDDEN;
      }
      
      await this.articleRepository.delete(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.FORBIDDEN) throw error;
      throw ERRORS.ARTICLE_DELETE_FAILED;
    }
  }

  // Get articles with filters and pagination
  async getArticles(filters: ArticleFilters): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      return await this.articleRepository.findWithFilters(filters);
    } catch (error) {
      console.error('Detailed database error:', error);
      throw ERRORS.DATABASE_ERROR;
    }
  }

  // Submit article for approval
  async submitArticle(id: number, authorId: number): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      if (article.author_id !== authorId) {
        throw ERRORS.FORBIDDEN;
      }
      
      if (!['draft', 'rejected'].includes(article.status)) {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      await this.articleRepository.updateStatus(id, 'pending');
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.FORBIDDEN || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Admin approve article
  async approveArticle(id: number): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      if (article.status !== 'pending') {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      await this.articleRepository.updateStatus(id, 'approved', true);
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Admin reject article
  async rejectArticle(id: number, rejectionReason?: string): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      if (article.status !== 'pending') {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      await this.articleRepository.updateStatusWithReason(id, 'rejected', rejectionReason || '');
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Mark as top news
  async markAsTopNews(id: number): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      if (article.status !== 'approved') {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      await this.articleRepository.updateTopNewsStatus(id, true);
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Unmark as top news
  async unmarkAsTopNews(id: number): Promise<ArticleWithAuthor> {
    try {
      await this.articleRepository.updateTopNewsStatus(id, false);
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }
  async findWithSearch(filters: ArticleFilters): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      return await this.articleRepository.findWithFiltersAndSearch(filters);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND) throw error;
      throw ERRORS.DATABASE_ERROR;
    }
  }

  // Get trending articles
  async getTrendingArticles(params: TrendingParams, authorId?: number): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      return await this.articleRepository.findTrending(params, authorId);
    } catch (error) {
      console.error('Error in getTrendingArticles:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw ERRORS.DATABASE_ERROR;
    }
  }

  // Increment view count
  async incrementViews(id: number): Promise<void> {
    try {
      await this.articleRepository.incrementViewCount(id);
    } catch (error) {
      // Silently fail for view count increment
    }
  }

  // Bulk delete articles (admin only)
  async bulkDeleteArticles(ids: number[]): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      await this.articleRepository.bulkDelete(ids);
    } catch (error) {
      if (error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_DELETE_FAILED;
    }
  }

  // Bulk approve articles (admin only)
  async bulkApproveArticles(ids: number[]): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      // First check if the articles exist at all
      const articlesExist = await this.articleRepository.checkArticlesExist(ids);
      
      if (!articlesExist) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      // Now approve pending articles without throwing error if none match
      await this.articleRepository.bulkUpdateStatus(ids, 'approved', true);
      
    } catch (error) {
      if (error === ERRORS.VALIDATION_ERROR || error === ERRORS.ARTICLE_NOT_FOUND) {
        throw error;
      }
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Bulk reject articles (admin only)
  async bulkRejectArticles(ids: number[], rejectionReason?: string): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      // First check if the articles exist at all
      const articlesExist = await this.articleRepository.checkArticlesExist(ids);
      
      if (!articlesExist) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      // Now reject pending articles without throwing error if none match
      await this.articleRepository.bulkUpdateStatusWithReason(ids, 'rejected', rejectionReason);
      
    } catch (error) {
      if (error === ERRORS.VALIDATION_ERROR || error === ERRORS.ARTICLE_NOT_FOUND) {
        throw error;
      }
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Bulk mark articles as top news (admin only)
  async bulkMarkAsTopNews(ids: number[]): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      await this.articleRepository.bulkUpdateTopNewsStatus(ids, true);
    } catch (error) {
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Bulk unmark articles as top news (admin only)
  async bulkUnmarkAsTopNews(ids: number[]): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      await this.articleRepository.bulkUpdateTopNewsStatus(ids, false);
    } catch (error) {
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }
}
import { RowDataPacket, OkPacket } from 'mysql2';
import { db } from '../database/db.ts';
import { 
  Article, 
  ArticleWithAuthor, 
  CreateArticleRequest, 
  UpdateArticleRequest, 
  ArticleFilters, 
  SearchParams, 
  TrendingParams,
  calculatePagination,
  PaginationInfo,
  ArticleTrending
} from '../models/article.model.ts';
import { ERRORS } from '../utils/error.ts';

export class ArticleService {
  
  // Create new article (author only)
  async createArticle(authorId: number, articleData: CreateArticleRequest): Promise<Article> {
    try {
      const query = `
        INSERT INTO articles (author_id, title, description, content, category, region)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute<OkPacket>(query, [
        authorId,
        articleData.title,
        articleData.description || null,
        articleData.content,
        articleData.category,
        articleData.region || null
      ]);
      
      return await this.getArticleById(result.insertId);
    } catch (error) {
      throw ERRORS.ARTICLE_CREATION_FAILED;
    }
  }

  // Get article by ID with author info
  async getArticleById(id: number): Promise<ArticleWithAuthor> {
    try {
      const query = `
        SELECT 
          a.*,
          au.name as author_name,
          au.email as author_email
        FROM articles a
        JOIN authors au ON a.author_id = au.id
        WHERE a.id = ?
      `;
      
      const [rows] = await db.execute<ArticleWithAuthor[]>(query, [id]);
      
      if (rows.length === 0) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      return rows[0];
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
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (updateData.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updateData.title);
      }
      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updateData.description);
      }
      if (updateData.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(updateData.content);
      }
      if (updateData.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(updateData.category);
      }
      if (updateData.region !== undefined) {
        updateFields.push('region = ?');
        updateValues.push(updateData.region);
      }
      
      if (updateFields.length === 0) {
        return article;
      }
      
      updateValues.push(id);
      
      const query = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`;
      await db.execute(query, updateValues);
      
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
      
      // Authorization: authors can delete draft articles, admin can delete any
      if (!isAdmin) {
        if (article.author_id !== userId || article.status !== 'draft') {
          throw ERRORS.FORBIDDEN;
        }
      }
      
      const query = `DELETE FROM articles WHERE id = ?`;
      await db.execute(query, [id]);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.FORBIDDEN) throw error;
      throw ERRORS.ARTICLE_DELETE_FAILED;
    }
  }

  // Get articles with filters and pagination
  
  async getArticles(filters: ArticleFilters): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      
      // Building the where conditions
      if (filters.status) {
        conditions.push('a.status = ?');
        values.push(filters.status);
      }
      if (filters.category) {
        conditions.push('a.category = ?');
        values.push(filters.category);
      }
      if (filters.region) {
        conditions.push('a.region = ?');
        values.push(filters.region);
      }
      if (filters.author_id) {
        conditions.push('a.author_id = ?');
        values.push(filters.author_id);
      }
      if (filters.is_top_news !== undefined) {
        conditions.push('a.is_top_news = ?');
        values.push(filters.is_top_news);
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Count total using execute (this works fine)
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM articles a 
        JOIN authors au ON a.author_id = au.id 
        ${whereClause}
      `;
      
      const [countResult] = await db.execute<RowDataPacket[]>(countQuery, values);
      const total = countResult[0].total;
      
      // Calculate pagination
      const page = filters.page || 1;
      const limit = Math.max(1, Math.min(100, filters.limit || 10));
      const offset = Math.max(0, (page - 1) * limit);
      const pagination = calculatePagination(page, limit, total);
      
      // Validate sortBy and sortOrder
      const validSortColumns = ['created_at', 'updated_at', 'title', 'status', 'category', 'region', 'is_top_news'];
      const sortBy = validSortColumns.includes(filters.sortBy || 'created_at') 
        ? (filters.sortBy || 'created_at') 
        : 'created_at';
      const sortOrder = (filters.sortOrder?.toUpperCase() === 'ASC' || filters.sortOrder?.toUpperCase() === 'DESC') 
        ? filters.sortOrder.toUpperCase() 
        : 'DESC';
      
      // Use db.query instead of db.execute for the main query
      const query = `
        SELECT 
          a.*,
          au.name as author_name,
          au.email as author_email
        FROM articles a
        JOIN authors au ON a.author_id = au.id
        ${whereClause}
        ORDER BY a.${sortBy} ${sortOrder}
        LIMIT ?, ?
      `;
      
      const mainQueryValues = [...values, offset, limit];
      
    
      
      // Try using query instead of execute
      const [rows] = await db.query<ArticleWithAuthor[]>(query, mainQueryValues);
      
      return { articles: rows, pagination };
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
      
      if (article.status !== 'draft') {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      const query = `UPDATE articles SET status = 'pending' WHERE id = ?`;
      await db.execute(query, [id]);
      
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
      
      const query = `UPDATE articles SET status = 'approved', publish_date = NOW() WHERE id = ?`;
      await db.execute(query, [id]);
      
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Admin reject article
  async rejectArticle(id: number): Promise<ArticleWithAuthor> {
    try {
      const article = await this.getArticleById(id);
      
      if (article.status !== 'pending') {
        throw ERRORS.VALIDATION_ERROR;
      }
      
      const query = `UPDATE articles SET status = 'rejected' WHERE id = ?`;
      await db.execute(query, [id]);
      
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
      
      const query = `UPDATE articles SET is_top_news = TRUE WHERE id = ?`;
      await db.execute(query, [id]);
      
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND || error === ERRORS.VALIDATION_ERROR) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Unmark as top news
  async unmarkAsTopNews(id: number): Promise<ArticleWithAuthor> {
    try {
      const query = `UPDATE articles SET is_top_news = FALSE WHERE id = ?`;
      await db.execute(query, [id]);
      
      return await this.getArticleById(id);
    } catch (error) {
      if (error === ERRORS.ARTICLE_NOT_FOUND) throw error;
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Search articles
  async searchArticles(searchParams: SearchParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      const conditions: string[] = ['a.status = "approved"'];
      const values: any[] = [];
      
      // Full-text search
      if (searchParams.query) {
        conditions.push('MATCH(a.title, a.content) AGAINST(? IN NATURAL LANGUAGE MODE)');
        values.push(searchParams.query);
      }
      
      if (searchParams.category) {
        conditions.push('a.category = ?');
        values.push(searchParams.category);
      }
      if (searchParams.region) {
        conditions.push('a.region = ?');
        values.push(searchParams.region);
      }
      
      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      
      // Count total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM articles a 
        JOIN authors au ON a.author_id = au.id 
        ${whereClause}
      `;
      const [countResult] = await db.query<RowDataPacket[]>(countQuery, values);
      const total = countResult[0].total;
      // Calculate pagination
      const page = searchParams.page || 1;
      const limit = Math.max(1, Math.min(100, searchParams.limit || 10));
      const offset = Math.max(0, (page - 1) * limit);
      const pagination = calculatePagination(page, limit, total);
      
      // Get articles with relevance score
      const query = `
        SELECT 
          a.*,
          au.name as author_name,
          au.email as author_email
        FROM articles a
        JOIN authors au ON a.author_id = au.id
        ${whereClause}
        ORDER BY a.publish_date DESC
        LIMIT ? , ?
      `;
      const [rows] = await db.query<ArticleWithAuthor[]>(query, [...values, offset, limit]);
      return { articles: rows, pagination };
    } catch (error) {
      throw ERRORS.DATABASE_ERROR;
    }
  }

  // Get trending articles
  async getTrendingArticles(params: TrendingParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
    try {
      const timeframe = params.timeframe || 'week';
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;
      
      let dateCondition = '';
      let trendingScoreQuery = '';
      
      switch (timeframe) {
        case 'day':
          dateCondition = 'AND COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
          trendingScoreQuery = `
            (
              (a.views_count * 0.9) +
              (a.views_count / GREATEST(TIMESTAMPDIFF(HOUR, COALESCE(a.publish_date, a.created_at), NOW()), 1) * 50) +
              (CASE 
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN (a.views_count * 0.6)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 3 HOUR) THEN (a.views_count * 0.5)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN (a.views_count * 0.4)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 12 HOUR) THEN (a.views_count * 0.3)
                ELSE 0 
              END) +
              (CASE 
                WHEN TIMESTAMPDIFF(HOUR, COALESCE(a.publish_date, a.created_at), NOW()) >= 1 
                THEN (a.views_count / TIMESTAMPDIFF(HOUR, COALESCE(a.publish_date, a.created_at), NOW()) * 10)
                ELSE 0
              END)
            )
          `;
          break;
          
        case 'week':
          dateCondition = 'AND COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          trendingScoreQuery = `
            (
              (a.views_count * 0.8) +
              (a.views_count / GREATEST(TIMESTAMPDIFF(DAY, COALESCE(a.publish_date, a.created_at), NOW()), 1) * 20) +
              (CASE 
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN (a.views_count * 0.4)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 2 DAY) THEN (a.views_count * 0.3)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 3 DAY) THEN (a.views_count * 0.2)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 5 DAY) THEN (a.views_count * 0.1)
                ELSE 0 
              END) +
              (CASE 
                WHEN TIMESTAMPDIFF(DAY, COALESCE(a.publish_date, a.created_at), NOW()) >= 2 
                THEN (a.views_count / TIMESTAMPDIFF(DAY, COALESCE(a.publish_date, a.created_at), NOW()) * 5)
                ELSE 0
              END)
            )
          `;
          break;
          
        case 'month':
          dateCondition = 'AND COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          trendingScoreQuery = `
            (
              (a.views_count * 0.6) +
              (a.views_count / GREATEST(TIMESTAMPDIFF(WEEK, COALESCE(a.publish_date, a.created_at), NOW()), 1) * 10) +
              (CASE 
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 3 DAY) THEN (a.views_count * 0.2)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN (a.views_count * 0.15)
                WHEN COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 2 WEEK) THEN (a.views_count * 0.1)
                ELSE 0 
              END) +
              (CASE 
                WHEN TIMESTAMPDIFF(WEEK, COALESCE(a.publish_date, a.created_at), NOW()) >= 1 
                THEN (a.views_count / TIMESTAMPDIFF(WEEK, COALESCE(a.publish_date, a.created_at), NOW()) * 3)
                ELSE 0
              END)
            )
          `;
          break;
          
        default:
          dateCondition = 'AND COALESCE(a.publish_date, a.created_at) >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          trendingScoreQuery = `(a.views_count * 1.0)`;
          break;
      }
      
      // Count total articles
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM articles a 
        LEFT JOIN authors au ON a.author_id = au.id 
        WHERE a.status = 'approved' ${dateCondition}
      `;
      
      const [countRows] = await db.execute<RowDataPacket[]>(countQuery);
      const total = countRows[0].total;
      
      const pagination = calculatePagination(page, limit, total);
      
      // Main query
      const query = `
        SELECT 
          a.id,
          a.author_id,
          a.title,
          a.description,
          a.content,
          a.category,
          a.region,
          a.status,
          a.is_top_news,
          a.views_count,
          a.publish_date,
          a.created_at,
          a.updated_at,
          COALESCE(au.name, 'Unknown') as author_name,
          COALESCE(au.email, '') as author_email,
          ${trendingScoreQuery} as trending_score,
          (a.views_count / GREATEST(TIMESTAMPDIFF(HOUR, COALESCE(a.publish_date, a.created_at), NOW()), 1)) as views_per_hour,
          TIMESTAMPDIFF(HOUR, COALESCE(a.publish_date, a.created_at), NOW()) as hours_since_publish
        FROM articles a 
        LEFT JOIN authors au ON a.author_id = au.id 
        WHERE a.status = 'approved' ${dateCondition}
        ORDER BY trending_score DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const [trendingRows] = await db.execute<ArticleTrending[]>(query);
      
      // Convert ArticleTrending to ArticleWithAuthor
      const articles: ArticleWithAuthor[] = trendingRows.map(row => {
        const { trending_score, views_per_hour, hours_since_publish, ...article } = row;
        return article;
      });
      
      return { articles, pagination };
      
    } catch (error) {
      console.error('Error in getTrendingArticles:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw ERRORS.DATABASE_ERROR;
    }
  }
  // Increment view count
  async incrementViews(id: number): Promise<void> {
    try {
      const query = `UPDATE articles SET views_count = views_count + 1 WHERE id = ? AND status = 'approved'`;
      await db.execute(query, [id]);
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

      const placeholders = ids.map(() => '?').join(',');
      const query = `DELETE FROM articles WHERE id IN (${placeholders})`;
      await db.execute(query, ids);
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
      const checkPlaceholders = ids.map(() => '?').join(',');
      const checkQuery = `SELECT COUNT(*) as count FROM articles WHERE id IN (${checkPlaceholders})`;
      const [checkResult] = await db.execute<RowDataPacket[]>(checkQuery, ids);
      
      if (checkResult[0].count === 0) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      // Now approve pending articles without throwing error if none match
      const placeholders = ids.map(() => '?').join(',');
      const query = `UPDATE articles SET status = 'approved', publish_date = NOW() WHERE id IN (${placeholders}) AND status = 'pending'`;
      await db.execute(query, ids);
      
    } catch (error) {
      if (error === ERRORS.VALIDATION_ERROR || error === ERRORS.ARTICLE_NOT_FOUND) {
        throw error;
      }
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }

  // Bulk reject articles (admin only)
  async bulkRejectArticles(ids: number[]): Promise<void> {
    try {
      if (!ids.length) {
        throw ERRORS.VALIDATION_ERROR;
      }

      // First check if the articles exist at all
      const checkPlaceholders = ids.map(() => '?').join(',');
      const checkQuery = `SELECT COUNT(*) as count FROM articles WHERE id IN (${checkPlaceholders})`;
      const [checkResult] = await db.execute<RowDataPacket[]>(checkQuery, ids);
      
      if (checkResult[0].count === 0) {
        throw ERRORS.ARTICLE_NOT_FOUND;
      }
      
      // Now reject pending articles without throwing error if none match
      const placeholders = ids.map(() => '?').join(',');
      const query = `UPDATE articles SET status = 'rejected' WHERE id IN (${placeholders}) AND status = 'pending'`;
      await db.execute(query, ids);
      
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

      const placeholders = ids.map(() => '?').join(',');
      const query = `UPDATE articles SET is_top_news = TRUE WHERE id IN (${placeholders}) AND status = 'approved'`;
      await db.execute(query, ids);
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

      const placeholders = ids.map(() => '?').join(',');
      const query = `UPDATE articles SET is_top_news = FALSE WHERE id IN (${placeholders})`;
      await db.execute(query, ids);
    } catch (error) {
      throw ERRORS.ARTICLE_UPDATE_FAILED;
    }
  }
}
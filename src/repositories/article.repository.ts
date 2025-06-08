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

export interface IArticleRepository {
  create(authorId: number, articleData: CreateArticleRequest): Promise<Article>;
  findById(id: number): Promise<ArticleWithAuthor | null>;
  update(id: number, updateData: Partial<UpdateArticleRequest>): Promise<void>;
  delete(id: number): Promise<void>;
  findWithFilters(filters: ArticleFilters): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }>;
  updateStatus(id: number, status: string, publishDate?: boolean): Promise<void>;
  updateTopNewsStatus(id: number, isTopNews: boolean): Promise<void>;
  search(searchParams: SearchParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }>;
  findTrending(params: TrendingParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }>;
  incrementViewCount(id: number): Promise<void>;
  bulkDelete(ids: number[]): Promise<void>;
  bulkUpdateStatus(ids: number[], status: string, publishDate?: boolean): Promise<void>;
  bulkUpdateTopNewsStatus(ids: number[], isTopNews: boolean): Promise<void>;
  checkArticlesExist(ids: number[]): Promise<boolean>;
}

export class ArticleRepository implements IArticleRepository {
  
  async create(authorId: number, articleData: CreateArticleRequest): Promise<Article> {
    const query = `
      INSERT INTO articles (author_id, title, description, content, category, region, tags, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute<OkPacket>(query, [
      authorId,
      articleData.title,
      articleData.description || null,
      articleData.content,
      articleData.category,
      articleData.region || null,
      articleData.tags ? JSON.stringify(articleData.tags) : null,
      articleData.image
    ]);
    
    const createdArticle = await this.findById(result.insertId);
    if (!createdArticle) {
      throw new Error('Failed to retrieve created article');
    }
    return createdArticle;
  }

  async findById(id: number): Promise<ArticleWithAuthor | null> {
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
      return null;
    }
    
    const article = rows[0];
    this.parseArticleTags(article);
    return article;
  }

  async update(id: number, updateData: Partial<UpdateArticleRequest>): Promise<void> {
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
    if (updateData.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(updateData.tags && updateData.tags.length > 0 ? JSON.stringify(updateData.tags) : null);
    }

    if (updateData.image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(updateData.image);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateValues.push(id);
    const query = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(query, updateValues);
  }

  async delete(id: number): Promise<void> {
    const query = `DELETE FROM articles WHERE id = ?`;
    await db.execute(query, [id]);
  }

  async findWithFilters(filters: ArticleFilters): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
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
    
    // Handle tags filtering
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'JSON_CONTAINS(a.tags, JSON_QUOTE(?))').join(' OR ');
      conditions.push(`(${tagConditions})`);
      values.push(...filters.tags);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Count total
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
    const [rows] = await db.query<ArticleWithAuthor[]>(query, mainQueryValues);
    
    // Parse tags for each article
    const articles = rows.map(article => {
      this.parseArticleTags(article);
      return article;
    });
    
    return { articles, pagination };
  }

  async updateStatus(id: number, status: string, publishDate: boolean = false): Promise<void> {
    let query = `UPDATE articles SET status = ?`;
    const values: any[] = [status];
    
    if (publishDate) {
      query += `, publish_date = NOW()`;
    }
    
    query += ` WHERE id = ?`;
    values.push(id);
    
    await db.execute(query, values);
  }

  async updateTopNewsStatus(id: number, isTopNews: boolean): Promise<void> {
    const query = `UPDATE articles SET is_top_news = ? WHERE id = ?`;
    await db.execute(query, [isTopNews, id]);
  }

  async search(searchParams: SearchParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
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
    
    // Handle tags filtering in search
    if (searchParams.tags && searchParams.tags.length > 0) {
      const tagConditions = searchParams.tags.map(() => 'JSON_CONTAINS(a.tags, JSON_QUOTE(?))').join(' OR ');
      conditions.push(`(${tagConditions})`);
      values.push(...searchParams.tags);
    }
    
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    // Count total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM articles a 
      JOIN authors au ON a.author_id = au.id 
      ${whereClause}
    `;
    
    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, values);
    const total = countResult[0].total;
    
    // Calculate pagination
    const page = searchParams.page || 1;
    const limit = Math.max(1, Math.min(100, searchParams.limit || 10));
    const offset = Math.max(0, (page - 1) * limit);
    const pagination = calculatePagination(page, limit, total);
    
    // Get articles
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
    
    // Parse tags for each article
    const articles = rows.map(article => {
      this.parseArticleTags(article);
      return article;
    });
    
    return { articles, pagination };
  }

  async findTrending(params: TrendingParams): Promise<{ articles: ArticleWithAuthor[], pagination: PaginationInfo }> {
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
        a.tags,
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
    
    // Convert ArticleTrending to ArticleWithAuthor and parse tags
    const articles: ArticleWithAuthor[] = trendingRows.map(row => {
      const { trending_score, views_per_hour, hours_since_publish, ...article } = row;
      this.parseArticleTags(article);
      return article;
    });
    
    return { articles, pagination };
  }

  async incrementViewCount(id: number): Promise<void> {
    const query = `UPDATE articles SET views_count = views_count + 1 WHERE id = ? AND status = 'approved'`;
    await db.execute(query, [id]);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (!ids.length) return;
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM articles WHERE id IN (${placeholders})`;
    await db.execute(query, ids);
  }

  async bulkUpdateStatus(ids: number[], status: string, publishDate: boolean = false): Promise<void> {
    if (!ids.length) return;
    
    const placeholders = ids.map(() => '?').join(',');
    let query = `UPDATE articles SET status = ?`;
    const values: any[] = [status];
    
    if (publishDate) {
      query += `, publish_date = NOW()`;
    }
    
    query += ` WHERE id IN (${placeholders}) AND status = 'pending'`;
    values.push(...ids);
    
    await db.execute(query, values);
  }

  async bulkUpdateTopNewsStatus(ids: number[], isTopNews: boolean): Promise<void> {
    if (!ids.length) return;
    
    const placeholders = ids.map(() => '?').join(',');
    let query = `UPDATE articles SET is_top_news = ? WHERE id IN (${placeholders})`;
    const values:(boolean | number)[]= [isTopNews, ...ids];
    
    if (isTopNews) {
      query = `UPDATE articles SET is_top_news = ? WHERE id IN (${placeholders}) AND status = 'approved'`;
    }
    
    await db.execute(query, values);
  }

  async checkArticlesExist(ids: number[]): Promise<boolean> {
    if (!ids.length) return false;
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT COUNT(*) as count FROM articles WHERE id IN (${placeholders})`;
    const [result] = await db.execute<RowDataPacket[]>(query, ids);
    
    return result[0].count > 0;
  }

  private parseArticleTags(article: ArticleWithAuthor): void {
    if (article.tags) {
      try {
        article.tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags;
      } catch (e) {
        article.tags = [];
      }
    }
  }
}
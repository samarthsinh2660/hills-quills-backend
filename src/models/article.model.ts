import { RowDataPacket } from "mysql2";

export const ARTICLE_TABLE = `
CREATE TABLE articles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  author_id      INT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  content        LONGTEXT,
  category       VARCHAR(100) NOT NULL,
  region         VARCHAR(100),
  tags           JSON,
  image          VARCHAR(255),
  status         ENUM('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  is_top_news    BOOLEAN NOT NULL DEFAULT FALSE,
  views_count    INT NOT NULL DEFAULT 0,
  publish_date   DATETIME,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_region (region),
  INDEX idx_top_news (is_top_news),
  INDEX idx_publish_date (publish_date),
  FULLTEXT INDEX idx_search (title, content)
)`;

// If you need to add tags column to existing table, use this migration:
export const ADD_TAGS_COLUMN = `
ALTER TABLE articles ADD COLUMN tags JSON AFTER region;
`;

export interface Article extends RowDataPacket {
  id: number;
  author_id: number;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  region: string | null;
  tags: string[] | null;
  image: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  is_top_news: boolean;
  views_count: number;
  publish_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ArticleWithAuthor extends Article {
  author_name: string;
  author_email: string;
}

export interface CreateArticleRequest {
  title: string;
  description?: string;
  content: string;
  category: string;
  region?: string;
  tags?: string[];
  image: string;
}

export interface UpdateArticleRequest {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  region?: string;
  tags?: string[];
  image?: string;
}

export interface ArticleFilters {
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  category?: string;
  region?: string;
  author_id?: number;
  is_top_news?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'publish_date' | 'views_count' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchParams {
  query: string;
  category?: string;
  region?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface TrendingParams {
  timeframe?: 'day' | 'week' | 'month';
  limit?: number;
  page?: number;
}

export interface ArticleTrending extends RowDataPacket, ArticleWithAuthor {
  trending_score?: number;
  views_per_hour?: number;
  hours_since_publish?: number;
  velocity_score?: number;
}

// Predefined categories for Uttarakhand tourism news
export const ARTICLE_CATEGORIES = [
  'Culture & Heritage',
  'Adventure Tourism',
  'Religious Tourism',
  'Hill Stations',
  'Wildlife & Nature',
  'Trekking & Hiking',
  'Pilgrimage',
  'Local Festivals',
  'Travel Guide',
  'Food & Cuisine',
  'Accommodation',
  'Transportation',
  'From Districts',
  'Breaking News',
  'Government Initiatives',
  'Seasonal Tourism'
] as const;

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

// Uttarakhand districts and regions
export const UTTARAKHAND_REGIONS = [
  'Dehradun',
  'Haridwar',
  'Rishikesh',
  'Uttarakhand',
  'Mussoorie',
  'Nainital',
  'Almora',
  'Pithoragarh',
  'Chamoli',
  'Rudraprayag',
  'Tehri Garhwal',
  'Pauri Garhwal',
  'Uttarkashi',
  'Bageshwar',
  'Champawat',
  'Kumaon',
  'Garhwal',
  'Char Dham',
  'Valley of Flowers',
  'Jim Corbett',
  'Kedarnath',
  'Badrinath',
  'Gangotri',
  'Yamunotri'
] as const;

export type UttarakhandRegion = typeof UTTARAKHAND_REGIONS[number];

// Article status flow validation
export const ARTICLE_STATUS_TRANSITIONS: Record<Article['status'], Article['status'][]> = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: [],
  rejected: ['pending']
};

export function canTransitionStatus(currentStatus: Article['status'], newStatus: Article['status']): boolean {
  return ARTICLE_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

export function validateArticleCategory(category: string): boolean {
  return ARTICLE_CATEGORIES.includes(category as ArticleCategory);
}

export function validateUttarakhandRegion(region: string): boolean {
  return UTTARAKHAND_REGIONS.includes(region as UttarakhandRegion);
}

// New tag validation functions
export function validateTags(tags: string[]): boolean {
  if (!Array.isArray(tags)) return false;
  if (tags.length > 10) return false; // Maximum 10 tags
  
  return tags.every(tag => {
    if (typeof tag !== 'string') return false;
    const trimmedTag = tag.trim();
    if (trimmedTag.length < 2 || trimmedTag.length > 30) return false; // Tag length between 2-30 characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedTag)) return false; // Only alphanumeric, spaces, hyphens, underscores
    return true;
  });
}

export function sanitizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter((tag, index, arr) => {
      // Remove duplicates and empty tags
      return tag.length >= 2 && tag.length <= 30 && arr.indexOf(tag) === index;
    })
    .slice(0, 10); // Limit to 10 tags
}

// Pagination helper
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculatePagination(page: number, limit: number, total: number): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}
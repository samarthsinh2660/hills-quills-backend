-- ========================================
-- 1. Authors
-- ========================================
CREATE TABLE authors (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  about             TEXT,
  profession        VARCHAR(100),
  profile_photo_url VARCHAR(255),
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
);




-- ========================================
-- 2. Admins
-- ========================================
CREATE TABLE admins (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('super','editor') NOT NULL DEFAULT 'editor',
  created_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ========================================
-- 4. Articles
-- ========================================
CREATE TABLE articles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  author_id      INT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  tags           JSON,
  description    TEXT,
  content        LONGTEXT,
  category       VARCHAR(100) NOT NULL,
  region         VARCHAR(100),
  image          VARCHAR(255),
  status         ENUM('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
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
);


-- ========================================
-- 5. Web Stories
-- ========================================
CREATE TABLE web_stories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  author_id    INT NOT NULL,
  title        VARCHAR(255) NOT NULL,
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  region       VARCHAR(100),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT
);



-- Slides for Web Stories
CREATE TABLE slides (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  web_story_id  INT NOT NULL,
  image_url     VARCHAR(255) NOT NULL,
  caption       VARCHAR(255),
  slide_order   INT NOT NULL,
  FOREIGN KEY (web_story_id) REFERENCES web_stories(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_slide_order (web_story_id, slide_order)
);



-- ========================================
-- 6. Ads
-- ========================================
CREATE TABLE ads (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  type                ENUM('google','admin') NOT NULL,
  image_url           VARCHAR(255),
  title               VARCHAR(255),
  link_url            VARCHAR(255),
  description         TEXT,
  created_by_admin_id INT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

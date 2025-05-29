import { RowDataPacket } from "mysql2";

export const WEB_STORY_TABLE = `
CREATE TABLE web_stories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  author_id    INT NOT NULL,
  title        VARCHAR(255) NOT NULL,
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  region       VARCHAR(100),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT
)
`;

export interface WebStory extends RowDataPacket {
  id: number;
  author_id: number;
  title: string;
  status: 'draft' | 'published';
  region: string | null;
  created_at: Date;
  updated_at: Date;
}

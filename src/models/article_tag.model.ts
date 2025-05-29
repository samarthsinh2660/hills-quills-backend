import { RowDataPacket } from "mysql2";

export const ARTICLE_TAG_TABLE = `
CREATE TABLE article_tags (
  article_id  INT NOT NULL,
  tag_id      INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)
`;

export interface ArticleTag extends RowDataPacket {
  article_id: number;
  tag_id: number;
}

import { RowDataPacket } from "mysql2";

export const SLIDE_TABLE = `
CREATE TABLE slides (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  web_story_id  INT NOT NULL,
  image_url     VARCHAR(255) NOT NULL,
  caption       VARCHAR(255),
  slide_order   INT NOT NULL,
  FOREIGN KEY (web_story_id) REFERENCES web_stories(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_slide_order (web_story_id, slide_order)
)
`;

export interface Slide extends RowDataPacket {
  id: number;
  web_story_id: number;
  image_url: string;
  caption: string | null;
  slide_order: number;
}

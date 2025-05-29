import { RowDataPacket } from "mysql2";

export const AUTHOR_TABLE = `
CREATE TABLE authors (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  about             TEXT,
  profession        VARCHAR(100),
  profile_photo_url VARCHAR(255),
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export interface Author extends RowDataPacket {
  id: number;
  name: string;
  about: string | null;
  profession: string | null;
  profile_photo_url: string | null;
  email: string;
  password_hash: string;
  created_at: Date;
}

import { RowDataPacket } from "mysql2";

export const ADMIN_TABLE = `
CREATE TABLE admins (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50) NOT NULL UNIQUE,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('super','editor') NOT NULL DEFAULT 'editor',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export interface Admin extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'super' | 'editor';
  created_at: Date;
}

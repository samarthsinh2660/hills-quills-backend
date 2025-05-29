import { RowDataPacket } from "mysql2";

export const AD_TABLE = `
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
)
`;

export interface Ad extends RowDataPacket {
  id: number;
  type: 'google' | 'admin';
  image_url: string | null;
  title: string | null;
  link_url: string | null;
  description: string | null;
  created_by_admin_id: number | null;
  created_at: Date;
  updated_at: Date;
}

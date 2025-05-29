import { RowDataPacket } from "mysql2";

export const TAG_TABLE = `
CREATE TABLE tags (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL UNIQUE
)
`;

export interface Tag extends RowDataPacket {
  id: number;
  name: string;
}

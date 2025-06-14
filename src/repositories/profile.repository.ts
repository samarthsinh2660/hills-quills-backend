import { db } from "../database/db.ts";
import { Admin } from "../models/admin.model.ts";
import { Author } from "../models/author.model.ts";

export class ProfileRepository{
// Update author method
static async updateAuthor(setClause: string, values: any[]): Promise<any> {
    const [result] = await db.query(
        `UPDATE authors SET ${setClause} WHERE id = ?`,
        values
    );
    return result;
}

// Update admin method
static async updateAdmin(setClause: string, values: any[]): Promise<any> {
    const [result] = await db.query(
        `UPDATE admins SET ${setClause} WHERE id = ?`,
        values
    );
    return result;
}

// Check if author email exists excluding specific ID
static async findAuthorByEmailExcluding(email: string, excludeId: number): Promise<Author[]> {
    const [rows] = await db.query<Author[]>(
        "SELECT id FROM authors WHERE email = ? AND id != ?",
        [email, excludeId]
    );
    return rows;
}

// Check if admin username exists excluding specific ID
static async findAdminByUsernameExcluding(username: string, excludeId: number): Promise<Admin[]> {
    const [rows] = await db.query<Admin[]>(
        "SELECT id FROM admins WHERE username = ? AND id != ?",
        [username, excludeId]
    );
    return rows;
}

// Check if admin email exists excluding specific ID
static async findAdminByEmailExcluding(email: string, excludeId: number): Promise<Admin[]> {
    const [rows] = await db.query<Admin[]>(
        "SELECT id FROM admins WHERE email = ? AND id != ?",
        [email, excludeId]
    );
    return rows;
}

// Get all authors with pagination
static async getAllAuthors(limit: number, offset: number): Promise<Author[]> {
    const [rows] = await db.query<Author[]>(
        `SELECT a.id, a.name, a.email, a.about, a.profession, a.profile_photo_url, a.is_active, a.created_at,
         COUNT(ar.id) as article_count 
         FROM authors a
         LEFT JOIN articles ar ON a.id = ar.author_id
         GROUP BY a.id
         ORDER BY a.created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows;
}

// Search authors with pagination
static async searchAuthors(search: string, limit: number, offset: number): Promise<Author[]> {
    const searchTerm = `%${search}%`;
    const [rows] = await db.query<Author[]>(
        `SELECT a.id, a.name, a.email, a.about, a.profession, a.profile_photo_url, a.is_active, a.created_at,
         COUNT(ar.id) as article_count
         FROM authors a 
         LEFT JOIN articles ar ON a.id = ar.author_id
         WHERE a.name LIKE ? OR a.email LIKE ? OR a.profession LIKE ?
         GROUP BY a.id
         ORDER BY a.created_at DESC 
         LIMIT ? OFFSET ?`,
        [searchTerm, searchTerm, searchTerm, limit, offset]
    );
    return rows;
}

// Get total authors count
static async getAuthorsCount(): Promise<number> {
    const [rows] = await db.query<any[]>(
        "SELECT COUNT(*) as count FROM authors"
    );
    return rows[0].count;
}

// Get total authors count for search
static async getAuthorsSearchCount(search: string): Promise<number> {
    const searchTerm = `%${search}%`;
    const [rows] = await db.query<any[]>(
        "SELECT COUNT(*) as count FROM authors WHERE name LIKE ? OR email LIKE ? OR profession LIKE ?",
        [searchTerm, searchTerm, searchTerm]
    );
    return rows[0].count;
}

// Update author active status
static async updateAuthorStatus(id: number, isActive: boolean): Promise<any> {
    const [result] = await db.query(
        `UPDATE authors SET is_active = ? WHERE id = ?`,
        [isActive, id]
    );
    return result;
}

// Delete author
static async deleteAuthor(id: number): Promise<any> {
    const [result] = await db.query(
        `DELETE FROM authors WHERE id = ?`,
        [id]
    );
    return result;
}

// Check if author has articles
static async getAuthorArticlesCount(id: number): Promise<number> {
    const [rows] = await db.query<any[]>(
        `SELECT COUNT(*) as count FROM articles WHERE author_id = ?`,
        [id]
    );
    return rows[0].count;
}
}
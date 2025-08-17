import { ERRORS, RequestError } from '@utils/error.ts';
import { db } from '../database/db.ts';
import { Author } from '../models/author.model.ts';
import { err, ok, Result } from "neverthrow";
import createLogger from "@utils/logger.ts";

const logger = createLogger('@author.repository');

// Interface for Author Repository
export interface IAuthorRepository {
  findAuthorByEmail(email: string): Promise<Result<Author[], RequestError>>;
  createAuthor(
    name: string,
    email: string,
    hashedPassword: string,
    about: string | null,
    profession: string | null,
    profile_photo_url: string | null
  ): Promise<Result<any, RequestError>>;
  getAuthorById(id: number): Promise<Result<Author, RequestError>>;
  updateAuthor(
    id: number,
    name?: string,
    email?: string,
    about?: string,
    profession?: string,
    profile_photo_url?: string
  ): Promise<Result<Author, RequestError>>;
  getAllAuthors(limit: number, offset: number): Promise<Result<Author[], RequestError>>;
  searchAuthors(search: string, limit: number, offset: number): Promise<Result<Author[], RequestError>>;
  getAuthorsCount(): Promise<Result<number, RequestError>>;
  getAuthorsSearchCount(search: string): Promise<Result<number, RequestError>>;
  updateAuthorStatus(id: number, isActive: boolean): Promise<Result<Author, RequestError>>;
  deleteAuthor(id: number): Promise<Result<Author, RequestError>>;
  getAuthorArticlesCount(id: number): Promise<Result<number, RequestError>>;
  updateAuthorPassword(email: string, hashedPassword: string): Promise<Result<void, RequestError>>;
}

export class AuthorRepositoryImpl implements IAuthorRepository {
  // Update author method

  async findAuthorByEmail(email: string): Promise<Result<Author[], RequestError>> {
    try {
      const [rows] = await db.query<Author[]>('SELECT * FROM authors WHERE email = ?', [email]);
      return ok(rows);
    } catch (error) {
      logger.error('Error finding author by email', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  async createAuthor(
    name: string,
    email: string,
    hashedPassword: string,
    about: string | null,
    profession: string | null,
    profile_photo_url: string | null
  ): Promise<Result<any, RequestError>> {
    try {
      const [result] = await db.query(
        `INSERT INTO authors (name, email, password_hash, about, profession, profile_photo_url) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, about, profession, profile_photo_url]
      );
      return ok(result);
    } catch (error) {
      logger.error('Error creating author', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  async getAuthorById(id: number): Promise<Result<Author, RequestError>> {
    try {
      const [rows] = await db.query<Author[]>(
        'SELECT id, name, email, about, profession, profile_photo_url, is_active, created_at FROM authors WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return err(ERRORS.AUTHOR_NOT_FOUND);
      }
      return ok(rows[0]);
    } catch (error) {
      logger.error('Error getting author by ID', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  async updateAuthor(
    id: number,
    name?: string,
    email?: string,
    about?: string,
    profession?: string,
    profile_photo_url?: string
  ): Promise<Result<Author, RequestError>> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
      }
      if (about !== undefined) {
        updates.push('about = ?');
        values.push(about);
      }
      if (profession !== undefined) {
        updates.push('profession = ?');
        values.push(profession);
      }
      if (profile_photo_url !== undefined) {
        updates.push('profile_photo_url = ?');
        values.push(profile_photo_url);
      }

      if (updates.length !== 0) {
        values.push(id);
        const [result] = await db.query(
          `UPDATE authors SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      return await this.getAuthorById(id);
    } catch (error) {
      logger.error('Error updating author', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Get all authors with pagination
  async getAllAuthors(limit: number, offset: number): Promise<Result<Author[], RequestError>> {
    try {
      const [rows] = await db.query<Author[]>(
        `SELECT id, name, email, about, profession, profile_photo_url, is_active, created_at
         FROM authors LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return ok(rows);
    } catch (error) {
      logger.error('Error getting all authors', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Search authors with pagination
  async searchAuthors(search: string, limit: number, offset: number): Promise<Result<Author[], RequestError>> {
    try {
      const searchTerm = `%${search}%`;
      const [rows] = await db.query<Author[]>(
        `SELECT id, name, email, about, profession, profile_photo_url, is_active, created_at
         FROM authors 
         WHERE name LIKE ? OR email LIKE ? OR profession LIKE ?
         LIMIT ? OFFSET ?`,
        [searchTerm, searchTerm, searchTerm, limit, offset]
      );
      return ok(rows);
    } catch (error) {
      logger.error('Error searching authors', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Get total authors count
  async getAuthorsCount(): Promise<Result<number, RequestError>> {
    try {
      const [rows] = await db.query<any[]>('SELECT COUNT(*) as count FROM authors');
      return ok(rows[0].count);
    } catch (error) {
      logger.error('Error getting authors count', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Get total authors count for search
  async getAuthorsSearchCount(search: string): Promise<Result<number, RequestError>> {
    try {
      const searchTerm = `%${search}%`;
      const [rows] = await db.query<any[]>(
        'SELECT COUNT(*) as count FROM authors WHERE name LIKE ? OR email LIKE ? OR profession LIKE ?',
        [searchTerm, searchTerm, searchTerm]
      );
      return ok(rows[0].count);
    } catch (error) {
      logger.error('Error getting authors search count', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Update author active status
  async updateAuthorStatus(id: number, isActive: boolean): Promise<Result<Author, RequestError>> {
    try {
      const [result] = await db.query(`UPDATE authors SET is_active = ? WHERE id = ?`, [
        isActive,
        id,
      ]);
      return await this.getAuthorById(id);
    } catch (error) {
      logger.error('Error updating author status', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Delete author
  async deleteAuthor(id: number): Promise<Result<Author, RequestError>> {
    try {
      const authorResult = await this.getAuthorById(id);
      if (authorResult.isErr()) {
        return authorResult;
      }
      
      const author = authorResult.value;
      const [result] = await db.query(`DELETE FROM authors WHERE id = ?`, [id]);
      return ok(author);
    } catch (error) {
      logger.error('Error deleting author', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }

  // Check if author has articles
  async getAuthorArticlesCount(id: number): Promise<Result<number, RequestError>> {
    try {
      const [rows] = await db.query<any[]>(
        `SELECT COUNT(*) as count FROM articles WHERE author_id = ?`,
        [id]
      );
      return ok(rows[0].count);
    } catch (error) {
      logger.error('Error getting author articles count', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }
  
  async updateAuthorPassword(email: string, hashedPassword: string): Promise<Result<void, RequestError>> {
    try {
      await db.execute('UPDATE authors SET password_hash = ? WHERE email = ?', [
        hashedPassword,
        email,
      ]);
      return ok(undefined);
    } catch (error) {
      logger.error('Error updating author password', error);
      return err(ERRORS.DATABASE_ERROR);
    }
  }
}

export const AuthorRepository = new AuthorRepositoryImpl();

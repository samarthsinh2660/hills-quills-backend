import { db } from "../database/db.ts";
import { Admin } from "../models/admin.model.ts";
import { Author } from "../models/author.model.ts";

export class AuthRepository {
    // Author repository methods
    static async findAuthorByEmail(email: string): Promise<Author[]> {
        const [rows] = await db.query<Author[]>(
            "SELECT id FROM authors WHERE email = ?",
            [email]
        );
        return rows;
    }

    static async createAuthor(
        name: string,
        email: string,
        hashedPassword: string,
        about: string | null,
        profession: string | null,
        profile_photo_url: string | null
    ): Promise<any> {
        const [result] = await db.query(
            `INSERT INTO authors (name, email, password_hash, about, profession, profile_photo_url) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, about, profession, profile_photo_url]
        );
        return result;
    }

    static async getAuthorByEmail(email: string): Promise<Author[]> {
        const [rows] = await db.query<Author[]>(
            "SELECT * FROM authors WHERE email = ?",
            [email]
        );
        return rows;
    }

    static async getAuthorById(id: number): Promise<Author[]> {
        const [rows] = await db.query<Author[]>(
            "SELECT id, name, email, about, profession, profile_photo_url, created_at FROM authors WHERE id = ?",
            [id]
        );
        return rows;
    }

    // Admin repository methods
    static async findAdminByUsername(username: string): Promise<Admin[]> {
        const [rows] = await db.query<Admin[]>(
            "SELECT id FROM admins WHERE username = ?",
            [username]
        );
        return rows;
    }

    static async findAdminByEmail(email: string): Promise<Admin[]> {
        const [rows] = await db.query<Admin[]>(
            "SELECT id FROM admins WHERE email = ?",
            [email]
        );
        return rows;
    }

    static async createAdmin(
        username: string,
        email: string,
        hashedPassword: string
    ): Promise<any> {
        const [result] = await db.query(
            `INSERT INTO admins (username, email, password_hash) 
             VALUES (?, ?, ?)`,
            [username, email, hashedPassword]
        );
        return result;
    }

    static async getAdminByEmail(email: string): Promise<Admin[]> {
        const [rows] = await db.query<Admin[]>(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );
        return rows;
    }

    static async getAdminById(id: number): Promise<Admin[]> {
        const [rows] = await db.query<Admin[]>(
            "SELECT id, username, email, created_at FROM admins WHERE id = ?",
            [id]
        );
        return rows;
    }
}
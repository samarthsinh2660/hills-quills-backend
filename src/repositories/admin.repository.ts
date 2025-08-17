import { ERRORS, RequestError } from "@utils/error.ts";
import { db } from "../database/db.ts";
import { Admin } from "../models/admin.model.ts";
import { Author } from "../models/author.model.ts";
import { ResultSetHeader } from "mysql2/promise";
import { err, ok, Result, ResultAsync } from "neverthrow";
import createLogger from "@utils/logger.ts";

const logger = createLogger('@admin.repository');


export interface IAdminRepository {
    findAdminByUsername(username: string): Promise<Result<Admin[], RequestError>>;
    findAdminByEmail(email: string): Promise<Result<Admin[], RequestError>>;
    createAdmin(username: string, email: string, hashedPassword: string): Promise<Result<Admin, RequestError>>;
    getAdminById(id: number): Promise<Result<Admin, RequestError>>;
    updateAdmin(username: string | undefined, email: string | undefined, userID: number): Promise<Result<Admin, RequestError>>;
    updateAdminPassword(adminID: number, hashedPassword: string): Promise<Result<Admin, RequestError>>;
}

class AdminRepositoryImpl implements IAdminRepository {
    // Admin repository methods
    async findAdminByUsername(username: string): Promise<Result<Admin[], RequestError>> {
        try {
            const [rows] = await db.query<Admin[]>(
                "SELECT id FROM admins WHERE username = ?",
                [username]
            );
            return ok(rows);
        } catch (error) {
            logger.error('Error finding admin by username', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }

    async findAdminByEmail(email: string): Promise<Result<Admin[], RequestError>> {
        try {
            const [rows] = await db.query<Admin[]>(
                "SELECT id, username, email, password_hash, role, created_at FROM admins WHERE email = ?",
                [email]
            );
            return ok(rows);
        } catch (error) {
            logger.error('Error finding admin by email', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }

    async createAdmin(
        username: string,
        email: string,
        hashedPassword: string
    ): Promise<Result<Admin, RequestError>> {
        try {
            const [result] = await db.query<ResultSetHeader>(
                `INSERT INTO admins (username, email, password_hash) 
                VALUES (?, ?, ?)`,
                [username, email, hashedPassword]
            );
            return await this.getAdminById(result.insertId);
        } catch (error) {
            logger.error('Error creating admin', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }

    async getAdminById(id: number): Promise<Result<Admin, RequestError>> {
        try {
            const [rows] = await db.query<Admin[]>(
                "SELECT id, username, email, created_at FROM admins WHERE id = ?",
                [id]
            );
            if (rows.length === 0) {
                return err(ERRORS.ADMIN_NOT_FOUND);
            }
            return ok(rows[0]);
        } catch (error) {
            logger.error('Error fetching admin by ID', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }

    
    async updateAdmin(username: string | undefined, email: string | undefined, adminID: number): Promise<Result<Admin, RequestError>> {
        try {
            const updates: string[] = [];
            const values: any[] = [];
            if (username !== undefined) {
                updates.push("username = ?");
                values.push(username);
            }
            if (email !== undefined) {
                updates.push("email = ?");
                values.push(email);
            }
        
            const setClause = updates.join(", ");
            values.push(adminID);
            
            await db.query(
                `UPDATE admins SET ${setClause} WHERE id = ?`,
                values
            );

            return await this.getAdminById(adminID);
        } catch (error) {
            logger.error('Error updating admin', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }
    
    async updateAdminPassword(adminID: number, hashedPassword: string): Promise<Result<Admin, RequestError>> {
        try {
            await db.execute(
                'UPDATE admins SET password_hash = ? WHERE id = ?',
                [hashedPassword, adminID]
            );
            return await this.getAdminById(adminID);
        } catch (error) {
            logger.error('Error updating admin password', error);
            return err(ERRORS.DATABASE_ERROR);
        }
    }
}

export const AdminRepository = new AdminRepositoryImpl();
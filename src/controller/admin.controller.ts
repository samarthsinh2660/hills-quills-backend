import { Request, Response, NextFunction } from "express";
import { ERRORS } from "../utils/error.ts";
import { successResponse } from "../utils/response.ts";
import { ProfileRepository } from "../repositories/profile.repository.ts";
import { AuthRepository } from "../repositories/auth.repository.ts";

// Update admin profile (for admins themselves)
export const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email } = req.body;
    
    try {
        const user = req.user!;
        
        // Only admins can update their own profile via this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (username !== undefined) {
            // Check if username already exists (excluding current user)
            const existingUsername = await ProfileRepository.findAdminByUsernameExcluding(username, user.id);
            if (existingUsername.length > 0) {
                throw ERRORS.ADMIN_USERNAME_EXISTS;
            }
            updates.push("username = ?");
            values.push(username);
        }
        
        if (email !== undefined) {
            // Check if email already exists (excluding current user)
            const existingEmail = await ProfileRepository.findAdminByEmailExcluding(email, user.id);
            if (existingEmail.length > 0) {
                throw ERRORS.ADMIN_EMAIL_EXISTS;
            }
            updates.push("email = ?");
            values.push(email);
        }

        if (updates.length === 0) {
            throw ERRORS.INVALID_REQUEST_BODY;
        }

        values.push(user.id);

        await ProfileRepository.updateAdmin(updates.join(", "), values);

        // Fetch updated profile
        const rows = await AuthRepository.getAdminById(user.id);
        
        if (rows.length === 0) {
            throw ERRORS.ADMIN_NOT_FOUND;
        }

        res.json(
            successResponse({
                ...rows[0],
                is_admin: true
            }, "Profile updated successfully")
        );
    } catch (error) {
        next(error);
    }
};

// Admin updates author profile
export const adminUpdateAuthorProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { authorId } = req.params;
    const { name, email, about, profession, profile_photo_url } = req.body;
    
    try {
        const user = req.user!;
        
        // Only admins can use this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }

        // Check if author exists
        const existingAuthor = await AuthRepository.getAuthorById(parseInt(authorId));
        if (existingAuthor.length === 0) {
            throw ERRORS.AUTHOR_NOT_FOUND;
        }

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
        }
        if (email !== undefined) {
            // Check if email already exists (excluding current author)
            const existingEmail = await ProfileRepository.findAuthorByEmailExcluding(email, parseInt(authorId));
            if (existingEmail.length > 0) {
                throw ERRORS.AUTHOR_EMAIL_EXISTS;
            }
            updates.push("email = ?");
            values.push(email);
        }
        if (about !== undefined) {
            updates.push("about = ?");
            values.push(about);
        }
        if (profession !== undefined) {
            updates.push("profession = ?");
            values.push(profession);
        }
        if (profile_photo_url !== undefined) {
            updates.push("profile_photo_url = ?");
            values.push(profile_photo_url);
        }

        if (updates.length === 0) {
            throw ERRORS.INVALID_REQUEST_BODY;
        }

        values.push(parseInt(authorId));

        await ProfileRepository.updateAuthor(updates.join(", "), values);

        // Fetch updated profile
        const rows = await AuthRepository.getAuthorById(parseInt(authorId));

        res.json(
            successResponse({
                ...rows[0],
                is_admin: false
            }, "Author profile updated successfully")
        );
    } catch (error) {
        next(error);
    }
};

// Admin fetches all authors
export const getAllAuthors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        
        // Only admins can access this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }

        const { page = 1, limit = 10, search } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let authors;
        let totalCount;

        if (search) {
            authors = await ProfileRepository.searchAuthors(search as string, parseInt(limit as string), offset);
            totalCount = await ProfileRepository.getAuthorsSearchCount(search as string);
        } else {
            authors = await ProfileRepository.getAllAuthors(parseInt(limit as string), offset);
            totalCount = await ProfileRepository.getAuthorsCount();
        }

        res.json(
            successResponse({
                authors: authors,
                pagination: {
                    current_page: parseInt(page as string),
                    total_pages: Math.ceil(totalCount / parseInt(limit as string)),
                    total_count: totalCount,
                    per_page: parseInt(limit as string)
                }
            }, "Authors retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

// Admin gets specific author details
export const getAuthorById = async (req: Request, res: Response, next: NextFunction) => {
    const { authorId } = req.params;
    
    try {
        const user = req.user!;
        
        // Only admins can access this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }

        const rows = await AuthRepository.getAuthorById(parseInt(authorId));
        
        if (rows.length === 0) {
            throw ERRORS.AUTHOR_NOT_FOUND;
        }

        // Get article count for this author
        const articleCount = await ProfileRepository.getAuthorArticlesCount(parseInt(authorId));

        res.json(
            successResponse({
                ...rows[0],
                article_count: articleCount,
                is_admin: false
            }, "Author details retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

// Admin can activate or deactivate an author
export const updateAuthorStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { authorId } = req.params;
    const { is_active } = req.body;
    
    try {
        const user = req.user!;
        
        // Only admins can access this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }
        
        if (is_active === undefined || typeof is_active !== 'boolean') {
            throw ERRORS.INVALID_REQUEST_BODY;
        }
        
        // Check if author exists
        const rows = await AuthRepository.getAuthorById(parseInt(authorId));
        if (rows.length === 0) {
            throw ERRORS.AUTHOR_NOT_FOUND;
        }
        
        await ProfileRepository.updateAuthorStatus(parseInt(authorId), is_active);
        
        // Get article count for this author
        const articleCount = await ProfileRepository.getAuthorArticlesCount(parseInt(authorId));
        
        res.json(
            successResponse({
                ...rows[0],
                is_active,
                article_count: articleCount,
                is_admin: false
            }, `Author has been ${is_active ? 'activated' : 'deactivated'} successfully`)
        );
    } catch (error) {
        next(error);
    }
};

// Admin can delete an author
export const deleteAuthor = async (req: Request, res: Response, next: NextFunction) => {
    const { authorId } = req.params;
    
    try {
        const user = req.user!;
        
        // Only admins can access this endpoint
        if (!user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }
        
        // Check if author exists
        const rows = await AuthRepository.getAuthorById(parseInt(authorId));
        if (rows.length === 0) {
            throw ERRORS.AUTHOR_NOT_FOUND;
        }
        
        // Check if author has articles
        const articleCount = await ProfileRepository.getAuthorArticlesCount(parseInt(authorId));
        if (articleCount > 0) {
            throw {
                ...ERRORS.ARTICLE_NOT_FOUND,
                message: "Cannot delete author with existing articles. Deactivate the author instead."
            };
        }
        
        await ProfileRepository.deleteAuthor(parseInt(authorId));
        
        res.json(
            successResponse(null, "Author deleted successfully")
        );
    } catch (error) {
        next(error);
    }
};
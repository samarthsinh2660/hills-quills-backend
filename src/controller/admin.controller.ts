import { ERRORS, RequestError } from "../utils/error.ts";
import { Admin } from "@models/admin.model.ts";
import { AdminRepository } from "@repositories/admin.repository.ts";
import createLogger from "@utils/logger.ts";
import { AuthorRepository } from "@repositories/author.repository.ts";
import { Author } from "@models/author.model.ts";
import { Paginated } from "types/pagination.ts";
import { err, ok, Result } from "neverthrow";

const logger = createLogger('@admin.controller')


// Update admin profile (for admins themselves)
export const updateAdminProfile = async (userID: number, email?: string, username?: string): Promise<Result<Admin, RequestError>>  => {

    if (username !== undefined) {
        // Check if username already exists (excluding current user)
        let existingUsername = await AdminRepository.findAdminByUsername(username);
        existingUsername= existingUsername.andThen((admins) => {
            if (admins.length > 0) {
                return err(ERRORS.ADMIN_USERNAME_EXISTS);
            }
            return ok(admins);
        })
        if(existingUsername.isErr()) {
            return err(existingUsername.error);
        }
    }

    if (email !== undefined) {
        // Check if email already exists (excluding current user)
        let existingEmail = await AdminRepository.findAdminByEmail(email);
        existingEmail = existingEmail.andThen((admins) => {
            if (admins.length > 0) {
                return err(ERRORS.ADMIN_EMAIL_EXISTS);
            }
            return ok(admins);
        })
        if(existingEmail.isErr()) {
            return err(existingEmail.error);
        }
    }
    return await AdminRepository.updateAdmin(username, email, userID);
};

// Update author profile by admin
export const updateAuthorProfile = async (
    authorId: number,
    name?: string,
    email?: string,
    about?: string,
    profession?: string,
    profile_photo_url?: string
): Promise<Result<Author, RequestError>> => {
    // Check if author exists
    const author = await AuthorRepository.getAuthorById(authorId);
    if (author.isErr()) {
        return err(author.error);
    }
    
    if (!author.value) {
        return err(ERRORS.AUTHOR_NOT_FOUND);
    }

    if (email !== undefined) {
        // Check if email already exists (excluding current author)
        const existingEmail = await AuthorRepository.findAuthorByEmail(email);
        if (existingEmail.isErr()) {
            return err(existingEmail.error);
        }
        
        if (existingEmail.value.length > 0) {
            return err(ERRORS.AUTHOR_EMAIL_EXISTS);
        }
    }
    
    // Update author profile
    return await AuthorRepository.updateAuthor(authorId, name, email, about, profession, profile_photo_url);
};

// Admin fetches all authors
export const getPaginatedAllAuthors = async (page: number, limit: number, search?: string): Promise<Result<Paginated<Author>, RequestError>> => {
    const offset = (page - 1) * limit;
    
    let authors;
    let totalCount;
    
    if (search) {
        authors = await AuthorRepository.searchAuthors(search as string, limit, offset);
        if (authors.isErr()) {
            return err(authors.error);
        }
        
        totalCount = await AuthorRepository.getAuthorsSearchCount(search as string);
        if (totalCount.isErr()) {
            return err(totalCount.error);
        }
    } else {
        authors = await AuthorRepository.getAllAuthors(limit, offset);
        if (authors.isErr()) {
            return err(authors.error);
        }
        
        totalCount = await AuthorRepository.getAuthorsCount();
        if (totalCount.isErr()) {
            return err(totalCount.error);
        }
    }
    
    return ok({
        data: authors.value,
        pagination: {
            current_page: page,
            total_pages: Math.ceil(totalCount.value / limit),
            total_count: totalCount.value,
            per_page: limit
        }
    });
};

// Admin gets specific author details
export const getAuthorById = async (authorId: number): Promise<Result<Author, RequestError>> => {
    const author = await AuthorRepository.getAuthorById(authorId);
    
    if (author.isErr()) {
        return err(author.error);
    }
    
    return author;
};

// Admin can activate or deactivate an author
export const updateAuthorStatus = async (authorID: number, is_active: boolean): Promise<Result<Author, RequestError>> => {
    // Check if author exists
    const author = await AuthorRepository.getAuthorById(authorID);
    if (author.isErr()) {
        return err(author.error);
    }
    
    return await AuthorRepository.updateAuthorStatus(authorID, is_active);
};

// Admin can delete an author
export const deleteAuthor = async (authorID: number): Promise<Result<Author, RequestError>> => {
    // Check if author exists
    const author = await AuthorRepository.getAuthorById(authorID);
    if (author.isErr()) {
        return err(author.error);
    }
    
    // Check if author has articles
    let articleCount = await AuthorRepository.getAuthorArticlesCount(authorID);

    articleCount = articleCount.andThen((count) => {
        if (count > 0) {
            return err(ERRORS.AUTHOR_CANNOT_BE_DELETED_ARTICLES_FOUND);
        }
        return ok(count);
    });
    if (articleCount.isErr()) {
        return err(articleCount.error);
    }
    
    return await AuthorRepository.deleteAuthor(authorID);
};
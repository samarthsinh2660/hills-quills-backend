import { ERRORS, RequestError } from "../utils/error.ts";
import { AuthorRepository } from "../repositories/author.repository.ts";
import { err, Result } from "neverthrow";
import { Author } from "@models/author.model.ts";

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
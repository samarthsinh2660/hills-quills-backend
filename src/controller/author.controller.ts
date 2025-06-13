import { Request, Response, NextFunction } from "express";
import { ERRORS } from "../utils/error.ts";
import { successResponse } from "../utils/response.ts";
import { ProfileRepository } from "../repositories/profile.repository.ts";
import { AuthRepository } from "../repositories/auth.repository.ts";

export const updateAuthorProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { name, about, profession, profile_photo_url } = req.body;
    
    try {
        const user = req.user!;
        
        // Only authors can update their own profile via this endpoint
        if (user.is_admin) {
            throw ERRORS.UNAUTHORIZED;
        }

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
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

        values.push(user.id);

        await ProfileRepository.updateAuthor(updates.join(", "), values);

        // Fetch updated profile
        const rows = await AuthRepository.getAuthorById(user.id);
        
        if (rows.length === 0) {
            throw ERRORS.AUTHOR_NOT_FOUND;
        }

        res.json(
            successResponse({
                ...rows[0],
                is_admin: false
            }, "Profile updated successfully")
        );
    } catch (error) {
        next(error);
    }
};
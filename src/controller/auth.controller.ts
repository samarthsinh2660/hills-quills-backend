import { Request, Response, NextFunction } from "express";
import { AuthRepository } from "../repositories/auth.repository.ts";
import bcrypt from "bcryptjs";
import {decodeRefreshToken, createAuthToken, createRefreshToken, TokenData } from "../utils/jwt.ts";
import { ERRORS } from "../utils/error.ts";
import { successResponse } from "../utils/response.ts";

export const signupAuthor = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, about, profession, profile_photo_url } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password) {
            throw ERRORS.AUTHOR_REQUIRED_FIELDS;
        }

        // Check if email already exists
        const existingRows = await AuthRepository.findAuthorByEmail(email);

        if (existingRows.length > 0) {
            throw ERRORS.AUTHOR_EMAIL_EXISTS;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new author
        const result = await AuthRepository.createAuthor(
            name,
            email,
            hashedPassword,
            about || null,
            profession || null,
            profile_photo_url || null
        );

        const authorId = (result as any).insertId;

        // Create token data
        const tokenData: TokenData = {
            id: authorId,
            is_admin: false,
            email,
            name
        };

        // Generate JWT token
        const token = createAuthToken(tokenData);

        res.status(201).json(
            successResponse({
                id: authorId,
                name,
                email,
                about: about || null,
                profession: profession || null,
                profile_photo_url: profile_photo_url || null,
                token,
            }, "Author account created successfully")
        );
    } catch (error) {
        next(error);
    }
};

export const signupAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    try {
        // Validate required fields
        if (!username || !email || !password) {
            throw ERRORS.ADMIN_REQUIRED_FIELDS;
        }

        // Check if username already exists
        const existingUsernameRows = await AuthRepository.findAdminByUsername(username);

        if (existingUsernameRows.length > 0) {
            throw ERRORS.ADMIN_USERNAME_EXISTS;
        }

        // Check if email already exists
        const existingEmailRows = await AuthRepository.findAdminByEmail(email);

        if (existingEmailRows.length > 0) {
            throw ERRORS.ADMIN_EMAIL_EXISTS;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new admin
        const result = await AuthRepository.createAdmin(username, email, hashedPassword);

        const adminId = (result as any).insertId;

        // Create token data
        const tokenData: TokenData = {
            id: adminId,
            is_admin: true,
            email,
            username
        };

        // Generate JWT token
        const token = createAuthToken(tokenData);

        res.status(201).json(
            successResponse({
                id: adminId,
                username,
                email,
                token,
            }, "Admin account created successfully")
        );
    } catch (error) {
        next(error);
    }
};

export const loginAuthor = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        const rows = await AuthRepository.getAuthorByEmail(email);

        if (rows.length === 0) {
            throw ERRORS.INVALID_AUTHOR_CREDENTIALS;
        }

        const author = rows[0];
        
        const isPasswordValid = await bcrypt.compare(password, author.password_hash);
        if (!isPasswordValid) {
            throw ERRORS.INVALID_AUTHOR_CREDENTIALS;
        }

        // Create token data
        const tokenData: TokenData = {
            id: author.id,
            is_admin: false,
            email: author.email,
            name: author.name
        };

        const token = createAuthToken(tokenData);
        const refreshToken = createRefreshToken(tokenData);

        res.status(200).json(
            successResponse({
                id: author.id,
                name: author.name,
                email: author.email,
                about: author.about,
                profession: author.profession,
                profile_photo_url: author.profile_photo_url,
                token: token,
                refresh_token: refreshToken,
            }, "Login successful")
        );
    } catch (error) {
        next(error);
    }
};

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;    

    try {
        const rows = await AuthRepository.getAdminByEmail(email);

        if (rows.length === 0) {
            throw ERRORS.INVALID_ADMIN_CREDENTIALS;
        }

        const admin = rows[0];

        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        if (!isPasswordValid) {
            throw ERRORS.INVALID_ADMIN_CREDENTIALS;
        }

        // Create token data
        const tokenData: TokenData = {
            id: admin.id,
            is_admin: true,
            email: admin.email,
            username: admin.username
        };

        const token = createAuthToken(tokenData);
        const refreshToken = createRefreshToken(tokenData);

        res.status(200).json(
            successResponse({
                id: admin.id,
                username: admin.username,
                email: admin.email,
                token: token,
                refresh_token: refreshToken,
            }, "Login successful")
        );
    } catch (error) {
        next(error);
    }
};

// Token refresh endpoint
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refresh_token } = req.body;

    try {
        if (!refresh_token) {
            throw ERRORS.INVALID_REFRESH_TOKEN;
        }

        // In a real implementation, you'd verify the refresh token from database
        // For now, we'll decode it and create a new auth token
        const decoded = decodeRefreshToken(refresh_token);
        const newToken = createAuthToken(decoded);

        res.json(
            successResponse({
                token: newToken
            }, "Token refreshed successfully")
        );
    } catch (error) {
        next(error);
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!; // We know user exists because of auth middleware

        if (user.is_admin) {
            const rows = await AuthRepository.getAdminById(user.id);

            if (rows.length === 0) {
                throw ERRORS.ADMIN_NOT_FOUND;
            }

            res.json(
                successResponse({
                    ...rows[0],
                    is_admin: true
                }, "Profile retrieved successfully")
            );
        } else {
            const rows = await AuthRepository.getAuthorById(user.id);

            if (rows.length === 0) {
                throw ERRORS.AUTHOR_NOT_FOUND;
            }

            res.json(
                successResponse({
                    ...rows[0],
                    is_admin: false
                }, "Profile retrieved successfully")
            );
        }
    } catch (error) {
        next(error);
    }
};
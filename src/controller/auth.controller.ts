import { Request, Response, NextFunction } from "express";
import { AuthRepository } from "../repositories/auth.repository.ts";
import { ProfileRepository } from '../repositories/profile.repository.ts';
import bcrypt from "bcryptjs";
import {decodeRefreshToken, createAuthToken, createRefreshToken, TokenData } from "../utils/jwt.ts";
import { ERRORS } from "../utils/error.ts";
import { successResponse } from "../utils/response.ts";
import { EmailService } from "../services/email.service.ts";
import crypto from 'crypto';

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

const otpStore = new Map<string, {
    otp: string;
    expiresAt: Date;
    userType: 'admin' | 'author';
    email: string;
  }>();
  
  export const sendPasswordOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email, userType } = req.body;
  
    try {
      if (!email || !userType || !['admin', 'author'].includes(userType)) {
        throw ERRORS.INVALID_REQUEST_BODY;
      }
  
      // Verify user exists
      let user;
      if (userType === 'admin') {
        const rows = await AuthRepository.getAdminByEmail(email);
        if (rows.length === 0) {
          throw ERRORS.ADMIN_NOT_FOUND;
        }
        user = rows[0];
      } else {
        const rows = await AuthRepository.getAuthorByEmail(email);
        if (rows.length === 0) {
          throw ERRORS.AUTHOR_NOT_FOUND;
        }
        user = rows[0];
      }
  
      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
      // Store OTP
      const otpKey = `${email}_${userType}`;
      otpStore.set(otpKey, {
        otp,
        expiresAt,
        userType,
        email
      });
  
      // Send OTP via email
      await EmailService.sendPasswordOTP(email, otp, user.username);
  
      res.json(
        successResponse(
          { message: 'OTP sent successfully' },
          'OTP sent to your email'
        )
      );
    } catch (error) {
      next(error);
    }
  };
  
  export const verifyPasswordOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword, userType } = req.body;
  
    try {
      if (!email || !otp || !newPassword || !userType || !['admin', 'author'].includes(userType)) {
        throw ERRORS.INVALID_REQUEST_BODY;
      }
  
      if (newPassword.length < 6) {
        throw ERRORS.PASSWORD_TOO_SHORT;
      }
  
      const otpKey = `${email}_${userType}`;
      const storedOTP = otpStore.get(otpKey);
  
      if (!storedOTP) {
        throw ERRORS.INVALID_OTP;
      }
  
      if (storedOTP.otp !== otp) {
        throw ERRORS.INVALID_OTP;
      }
  
      if (new Date() > storedOTP.expiresAt) {
        otpStore.delete(otpKey);
        throw ERRORS.OTP_EXPIRED;
      }
  
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
  
      // Update password in database
      if (userType === 'admin') {
        await ProfileRepository.updateAdminPassword(email, hashedPassword);
      } else {
        await ProfileRepository.updateAuthorPassword(email, hashedPassword);
      }
  
      // Remove OTP from store
      otpStore.delete(otpKey);
  
      res.json(
        successResponse(
          { message: 'Password changed successfully' },
          'Password updated successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  };
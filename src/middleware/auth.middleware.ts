import { Request, Response, NextFunction } from 'express';
import { decodeAuthToken, TokenData } from '../utils/jwt.ts';
import { ERRORS } from '../utils/error.ts';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: TokenData;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ERRORS.NO_TOKEN_PROVIDED;
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = decodeAuthToken(token);
        
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw ERRORS.UNAUTHORIZED;
        }
        
        if (!req.user.is_admin) {
            throw ERRORS.ADMIN_ONLY_ROUTE;
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw ERRORS.UNAUTHORIZED;
        }
        
        next();
    } catch (error) {
        next(error);
    }
};
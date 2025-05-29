import { TokenData } from '../utils/jwt.ts';

declare global {
    namespace Express {
        interface Request {
            user?: TokenData;
        }
    }
}
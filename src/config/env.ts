// import { config } from "dotenv";
// config({path: `.env.${process.env.NODE_ENV|| 'development'}.local`});

// export const {
//     PORT,NODE_ENV,SERVER_URL,
//     DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT,
//     JWT_SECRET,JWT_EXPIRES_IN
// } = process.env;

import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

// Required string values
export const PORT = process.env.PORT || '3000';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

export const DB_HOST = process.env.DB_HOST!;
export const DB_USER = process.env.DB_USER!;
export const DB_PASSWORD = process.env.DB_PASSWORD!;
export const DB_NAME = process.env.DB_NAME!;
export const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);

// JWT: assert that these are defined
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

//cors
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3001';

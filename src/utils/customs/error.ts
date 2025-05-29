export interface CustomError extends Error {
    statusCode?: number;
    code?: number;
}
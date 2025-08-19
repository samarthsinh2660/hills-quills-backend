// code taken from https://github.com/Aquila169/zod-express-middleware/blob/c434943b385eca214533f6c38caf83d513477dc8/src/index.ts#L50
// this has body as well as query parser right now using just body modify if needed
import { Request } from 'express';
import { NextFunction, Response } from 'express';
import { ZodType } from 'zod';
import { ERRORS } from '@utils/error';
import createLogger from '@utils/logger';


const logger = createLogger('@requestValidator')

export declare type RequestValidation = {
    params?: ZodType;
    query?: ZodType;
    body?: ZodType;
};

const validateRequest = ({body, query, params}: RequestValidation) => (req: Request, res: Response, next: NextFunction) => {
    if(body) {
        const parsed = body.safeParse(req.body)
        if(!parsed.success) {
            logger.error(parsed.error)
            next(ERRORS.INVALID_REQUEST_BODY)
        }
    }
    if(query) {
        const parsed = query.safeParse(req.query)
        if(!parsed.success) {
            logger.error(parsed.error)
            next(ERRORS.INVALID_QUERY_PARAMETER)
        } 
    }
    next()
}

export default validateRequest;

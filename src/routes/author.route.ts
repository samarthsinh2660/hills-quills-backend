import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.ts';
import { updateAuthorProfile } from '../controller/author.controller.ts';

const authorRouter = Router();

authorRouter.put('/author/profile', authenticate, updateAuthorProfile);

export default authorRouter;

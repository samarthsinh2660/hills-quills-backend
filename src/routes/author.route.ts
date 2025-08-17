import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.ts';
import { updateAuthorProfile } from '../controller/author.controller.ts';
import z from 'zod';
import validateRequest from '@middleware/validate-request.middleware.ts';

const authorRouter = Router();

const SCHEMA = {
  AUTHOR_PROFILE: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    about: z.string().optional(),
    profession: z.string().optional(),
    profile_photo_url: z.string().url().optional(),
  }),
}


authorRouter.put('/author/profile',
    authenticate, 
    validateRequest({ body: SCHEMA.AUTHOR_PROFILE }),
    async (req, res, next) => {
        const authorId = req.user!.id; // Assuming user ID is stored in req.user
        const body: z.infer<typeof SCHEMA.AUTHOR_PROFILE> = req.body;
        const { name, email, about, profession, profile_photo_url } = body;
        const result = await updateAuthorProfile(authorId, name, email, about, profession, profile_photo_url);
        
        result.match(
            (data) => res.json({ success: true, data }),
            (error) => next(error)
        );
    }
);

export default authorRouter;

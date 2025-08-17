import { NextFunction, Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';
import {
  updateAdminProfile,
  getAuthorById,
  updateAuthorProfile,
  deleteAuthor,
  getPaginatedAllAuthors,
  updateAuthorStatus,
} from '../controller/admin.controller.ts';
import z from 'zod';
import validateRequest from '@middleware/validate-request.middleware.ts';
import { ERRORS } from '@utils/error.ts';
import { successResponse } from '@utils/response.ts';
import { errorHandler } from '@middleware/error.middleware.ts';

const SCHEMA = {
  PROFILE: z.object({
    username: z.string().optional(),
    email: z.email().optional(),
  }),
  AUTHOR_PROFILE: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    about: z.string().optional(),
    profession: z.string().optional(),
    profile_photo_url: z.url().optional(),
  }),
  GET_ALL_AUTHORS: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10),
    search: z.string().optional(),
  }),
  UPDATE_AUTHOR_STATUS: z.object({
    authorID: z.number().int().positive(),
    is_active: z.boolean()
  }),
};

const adminRouter = Router();
adminRouter.put(
  '/profile',
  authenticate,
  requireAdmin,
  validateRequest({ body: SCHEMA.PROFILE }),
  async function (req: Request, res: Response, next: NextFunction) {
    const body: z.infer<typeof SCHEMA.PROFILE> = req.body;
    if (!body.username && !body.email) {
      return next(ERRORS.INVALID_REQUEST_BODY);
    }

    const result = await updateAdminProfile(req.user!.id, body.email, body.username);
    result.match(
      (data) => res.json(successResponse(data, 'Profile updated successfully')),
      (error) => next(error)
    );
  },
);
// Admin Routes for Author Management
adminRouter.get(
  '/authors',
  authenticate,
  requireAdmin,
  validateRequest({
    query: SCHEMA.GET_ALL_AUTHORS,
  }),
  async function (req: Request, res: Response, next: NextFunction) {
    const query = SCHEMA.GET_ALL_AUTHORS.parse(req.query);
    const { page, limit, search } = query;

    const result = await getPaginatedAllAuthors(page, limit, search);
    result.match(
      (data) => res.json(successResponse(data, 'Authors fetched successfully')),
      (error) => next(error)
    );
  }
);

adminRouter.get(
  '/authors/:authorId',
  authenticate,
  requireAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const authorId = Number(req.params.authorId);
    if (!Number.isInteger(authorId)) {
      return next(ERRORS.INVALID_AUTHOR_ID);
    }

    const result = await getAuthorById(authorId);
    result.match(
      (data) => res.json(successResponse(data, 'Author fetched successfully')),
      (error) => next(error)
    );
  }
);

adminRouter.put(
  '/authors/status',
  authenticate,
  requireAdmin,
  validateRequest({
    body: SCHEMA.UPDATE_AUTHOR_STATUS,
  }),
  async function (req: Request, res: Response, next: NextFunction) {
    const body: z.infer<typeof SCHEMA.UPDATE_AUTHOR_STATUS> = req.body;
    const { authorID, is_active } = body;
    console.log(authorID, is_active)

    const result = await updateAuthorStatus(authorID, is_active);
    result.match(
      (data) => res.json(successResponse(data, 'Author status updated successfully')),
      (error) => next(error)
    );
  }
);

adminRouter.put(
  '/authors/:authorId',
  authenticate,
  requireAdmin,
  validateRequest({
    body: SCHEMA.AUTHOR_PROFILE,
  }),
  async function (req: Request, res: Response, next: NextFunction) {
    const authorId = Number(req.params.authorId);
    if (!Number.isInteger(authorId)) {
      return next(ERRORS.INVALID_AUTHOR_ID);
    }

    const body: z.infer<typeof SCHEMA.AUTHOR_PROFILE> = req.body;

    if (!body.name && !body.email && !body.about && !body.profession && !body.profile_photo_url) {
      return next(ERRORS.INVALID_REQUEST_BODY);
    }

    const result = await updateAuthorProfile(
      authorId,
      body.name,
      body.email,
      body.about,
      body.profession,
      body.profile_photo_url
    );

    result.match(
      (data) => res.json(successResponse(data, 'Author profile updated successfully')),
      (error) => next(error)
    );
  }
);

adminRouter.delete(
  '/authors/:authorID',
  authenticate,
  requireAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { authorID: authorIDString } = req.params;
    const authorID = Number(authorIDString);
    if (!Number.isInteger(authorID)) {
      return next(ERRORS.INVALID_AUTHOR_ID);
    }
    const result = await deleteAuthor(authorID);
    result.match(
      (data) => res.json(successResponse(data, 'Author deleted successfully')),
      (error) => next(error)
    );
  }
);

adminRouter.use(errorHandler);

export default adminRouter;

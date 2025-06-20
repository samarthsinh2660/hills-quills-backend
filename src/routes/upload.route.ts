import { Router } from 'express';
import { uploadImage } from '../controller/upload.controller.ts';
import { upload } from '../middleware/upload.middleware.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const uploadRouter = Router();

// Route for image uploads - requires authentication and uses multer middleware for file handling
uploadRouter.post('/', authenticate, upload.single('image'), uploadImage);

export default uploadRouter;

import { Router } from 'express';
import {
  loginAuthor,
  loginAdmin,
  signupAuthor,
  signupAdmin,
  getProfile,
  sendPasswordOTP,
  verifyPasswordOTP
} from '../controller/auth.controller.ts';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.ts';


const Loginrouter = Router();

// Author Auth Routes
Loginrouter.post('/authors/signup', signupAuthor);
Loginrouter.post('/authors/login', loginAuthor);
Loginrouter.get('/author/me', authenticate, getProfile);


// Admin Auth Routes
Loginrouter.post('/admin/signup', signupAdmin);
Loginrouter.post('/admin/login', loginAdmin);
Loginrouter.get('/admin/me', authenticate, requireAdmin, getProfile);

Loginrouter.post('/send-password-otp', authenticate, sendPasswordOTP);
Loginrouter.post('/verify-password-otp', authenticate, verifyPasswordOTP);

export default Loginrouter;
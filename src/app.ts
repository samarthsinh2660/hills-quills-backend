import express, { Application, Request, Response } from 'express';
import {limiter} from './middleware/ratelimit.middleware.ts';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {PORT,CORS_ORIGIN} from './config/env.ts';
import { connectToDatabase } from './database/db.ts';
import Loginrouter from './routes/auth.route.ts';
import articleRouter from './routes/articles.route.ts';
import publicRouter from './routes/public.route.ts';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.ts';
import adminRouter from './routes/admin.route.ts';
import authorRouter from './routes/author.route.ts';
import uploadRouter from './routes/upload.route.ts';


async function start() {
    const app: Application = express()
    
// Rate limiting middleware
   app.use(limiter);

   //cors middleware
   app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
   }));
    //allow use handel send in requre it is also a middleware 
   app.use(express.json({ limit: '10mb' }));
   //process html data in to json form
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
   //to store user data  
   app.use(cookieParser());
   
   //api checks
   app.get('/health', (req, res) => {
     res.json({ status: 'OK', timestamp: new Date().toISOString() });
     });
   app.get('/', (req: Request, res: Response) => {
     res.json({
        success: true,
        message: 'hills-quills api is running'
     }); 
   })
  
   //login route
    app.use('/api/auth', Loginrouter);
    app.use('/api/articles', articleRouter);
    app.use('/api/public', publicRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/author', authorRouter);
    app.use('/api/upload-image', uploadRouter);


    //erros 
    app.use(notFoundHandler);
    app.use(errorHandler);


    app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);

    await connectToDatabase();
    })
}


start();

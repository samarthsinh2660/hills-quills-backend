import express, { Application, Request, Response } from 'express';
import {limiter} from './middleware/ratelimit.middleware.ts';
import cookieParser from 'cookie-parser';
import {PORT} from './config/env.ts';
import { connectToDatabase } from './database/db.ts';
import Loginrouter from './routes/auth.route.ts';
import articleRouter from './routes/articles.route.ts';
import publicRouter from './routes/public.route.ts';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.ts';



async function start() {
    const app: Application = express()
    
// Rate limiting middleware
   app.use(limiter);


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


    //erros 
    app.use(notFoundHandler);
    app.use(errorHandler);


    app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);

    await connectToDatabase();
    })
}


start();

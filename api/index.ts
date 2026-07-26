import express, { Request, Response, NextFunction } from 'express';
import videoRoutes from '../src/server/routes/video.routes.js';
import { getMissingServerEnvironmentVariables } from '../src/server/config/environment.js';

const missingEnvironmentVariables = getMissingServerEnvironmentVariables();
if (missingEnvironmentVariables.length > 0) {
  console.error('[ServerConfig] Missing required environment variables', {
    missing: missingEnvironmentVariables,
  });
}

const app = express();
app.use(express.json());

// CORS headers for Vercel Serverless Function
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/video', videoRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized Error Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export default app;

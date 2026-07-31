import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import videoRoutes from './src/server/routes/video.routes.js';
import { validateServerEnvironment } from './src/server/config/environment.js';
import pricingRoutes from './src/server/routes/pricing.routes.js';
import checkoutRoutes from './src/server/routes/checkout.routes.js';
import clientErrorRoutes from './src/server/routes/client-error.routes.js';
import mediaRoutes from './src/server/routes/media.routes.js';
import instructorRoutes from './src/server/routes/instructor.routes.js';
import documentRoutes from './src/server/routes/document.routes.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/video', videoRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/client-errors', clientErrorRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/documents', documentRoutes);

// Setup Vite middleware for development or static serving for production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Centralized Error Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function startServer() {
  validateServerEnvironment();
  await setupVite();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful Shutdown Handling
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server shut down.');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

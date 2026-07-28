import { Router, type Request, type Response } from 'express';

const router = Router();
router.post('/', (req: Request, res: Response) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.slice(0, 500) : 'Unknown client error';
  const path = typeof req.body?.path === 'string' ? req.body.path.slice(0, 500) : 'unknown';
  const context = typeof req.body?.context === 'string' ? req.body.context.slice(0, 1000) : undefined;
  console.error('[ClientError]', { message, path, context, correlationId: req.headers['x-vercel-id'] || req.headers['x-request-id'] });
  res.status(204).end();
});
export default router;

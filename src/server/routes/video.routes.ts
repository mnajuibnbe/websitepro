import { Router } from 'express';
import { generateToken, streamVideo } from '../controllers/video.controller.js';

const router = Router();

router.post('/token', generateToken);
router.get('/stream', streamVideo);
router.get('/env', (req, res) => res.json({ streamToken: !!process.env.STREAMING_TOKEN_SECRET, serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY }));


export default router;

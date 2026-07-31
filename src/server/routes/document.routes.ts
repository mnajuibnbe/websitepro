import { Router } from 'express';
import { generateDocumentToken, inspectDocument, streamDocument } from '../controllers/document.controller.js';

const router = Router();
router.post('/token', generateDocumentToken);
router.head('/file', inspectDocument);
router.get('/file', streamDocument);

export default router;

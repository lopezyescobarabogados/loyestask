import { Router } from 'express';
import { PDFController } from '../controllers/PDFController';
import { authenticate } from '../middleware/auth';
import { projectExists } from '../middleware/project';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas para generación de PDF
router.get('/project/:projectId/info', projectExists, PDFController.getProjectInfo);
router.get('/project/:projectId/download', projectExists, PDFController.generateProjectPDF);
router.get('/project/:projectId/preview', projectExists, PDFController.previewProjectPDF);

export default router;

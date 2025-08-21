import { Router } from 'express';
import { PDFController } from '../controllers/PDFController';
import { authenticate } from '../middleware/auth';
import { projectExists } from '../middleware/project';
import { requireAdmin } from '../middleware/role';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Ruta especial para administradores - reporte resumido de todas las tareas
router.get('/admin/summary/download', requireAdmin, PDFController.generateAdminSummaryPDF);

// Rutas para generación de PDF de proyectos específicos
router.get('/project/:projectId/info', projectExists, PDFController.getProjectInfo);
router.get('/project/:projectId/download', projectExists, PDFController.generateProjectPDF);
router.get('/project/:projectId/preview', projectExists, PDFController.previewProjectPDF);

export default router;

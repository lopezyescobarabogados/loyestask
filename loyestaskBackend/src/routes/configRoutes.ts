import { Router } from 'express';
import { ConfigController } from '../controllers/ConfigController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

// Rutas públicas (configuración básica)
router.get('/system', ConfigController.getSystemConfig);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Rutas de administrador
router.put('/notifications', requireAdmin, ConfigController.updateNotificationConfig);
router.get('/metrics', requireAdmin, ConfigController.getSystemMetrics);
router.put('/system', requireAdmin, ConfigController.updateSystemConfig);
router.post('/reset', requireAdmin, ConfigController.resetConfigToDefaults);

export default router;

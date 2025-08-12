import { Router } from 'express';
import { body, param } from 'express-validator';
import { PerformanceController } from '../controllers/PerformanceController';
import { handleInputErrors } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Obtener métricas de todos los usuarios (solo admin)
router.get('/users',
    requireAdmin,
    PerformanceController.getAllUsersPerformance
);

// Obtener métricas detalladas de un usuario (solo admin)
router.get('/users/:userId',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID de usuario no válido'),
    handleInputErrors,
    PerformanceController.getUserPerformance
);

// Obtener predicciones de rendimiento (solo admin)
router.get('/users/:userId/predictions',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID de usuario no válido'),
    handleInputErrors,
    PerformanceController.getPerformancePredictions
);

// Generar evaluación automatizada objetiva (solo admin)
router.get('/users/:userId/automated-evaluation',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID de usuario no válido'),
    handleInputErrors,
    PerformanceController.generateAutomatedEvaluation
);

// Crear evaluación de usuario (solo admin)
router.post('/users/:userId/evaluations',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID de usuario no válido'),
    body('period.startDate')
        .isISO8601().withMessage('Fecha de inicio no válida'),
    body('period.endDate')
        .isISO8601().withMessage('Fecha de fin no válida'),
    body('metrics.taskCompletionRate')
        .isFloat({ min: 0, max: 100 }).withMessage('Tasa de finalización debe estar entre 0 y 100'),
    body('metrics.averageCompletionTime')
        .isFloat({ min: 0 }).withMessage('Tiempo promedio debe ser mayor a 0'),
    body('metrics.productivity')
        .isFloat({ min: 0 }).withMessage('Productividad debe ser mayor a 0'),
    body('metrics.qualityScore')
        .isFloat({ min: 1, max: 10 }).withMessage('Puntuación de calidad debe estar entre 1 y 10'),
    body('score')
        .isInt({ min: 1, max: 100 }).withMessage('Puntuación debe estar entre 1 y 100'),
    body('comments')
        .notEmpty().withMessage('Los comentarios son obligatorios')
        .isLength({ min: 10 }).withMessage('Los comentarios deben tener al menos 10 caracteres'),
    body('recommendations')
        .optional()
        .isString().withMessage('Las recomendaciones deben ser texto'),
    handleInputErrors,
    PerformanceController.createEvaluation
);

// Obtener evaluaciones de un usuario (admin o el propio usuario)
router.get('/users/:userId/evaluations',
    param('userId').isMongoId().withMessage('ID de usuario no válido'),
    handleInputErrors,
    PerformanceController.getUserEvaluations
);

// Obtener dashboard personal del usuario
router.get('/dashboard',
    PerformanceController.getUserDashboard
);

export default router;

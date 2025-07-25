import { Router } from 'express';
import { body, param } from 'express-validator';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/auth';
import { handleInputErrors } from '../middleware/validation';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * Obtener preferencias de notificación del usuario
 * GET /api/notifications/preferences
 */
router.get('/preferences', NotificationController.getUserPreferences);

/**
 * Obtener resumen de notificaciones del usuario
 * GET /api/notifications/summary
 */
router.get('/summary', NotificationController.getNotificationSummary);

/**
 * Obtener preferencia específica para una tarea
 * GET /api/notifications/tasks/:taskId/preference
 */
router.get(
  '/tasks/:taskId/preference',
  param('taskId').isMongoId().withMessage('ID de tarea inválido'),
  handleInputErrors,
  NotificationController.getTaskPreference
);

/**
 * Configurar preferencia de notificación para una tarea
 * POST /api/notifications/tasks/:taskId/preference
 */
router.post(
  '/tasks/:taskId/preference',
  param('taskId').isMongoId().withMessage('ID de tarea inválido'),
  body('reminderDays')
    .isInt({ min: 0, max: 30 })
    .withMessage('Los días de recordatorio deben ser un número entre 0 y 30'),
  body('isEnabled')
    .optional()
    .isBoolean()
    .withMessage('isEnabled debe ser un booleano'),
  body('isDailyReminderEnabled')
    .optional()
    .isBoolean()
    .withMessage('isDailyReminderEnabled debe ser un booleano'),
  handleInputErrors,
  NotificationController.setTaskPreference
);

/**
 * Actualizar preferencia de notificación para una tarea
 * PUT /api/notifications/tasks/:taskId/preference
 */
router.put(
  '/tasks/:taskId/preference',
  param('taskId').isMongoId().withMessage('ID de tarea inválido'),
  body('reminderDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Los días de recordatorio deben ser un número entre 0 y 30'),
  body('isEnabled')
    .optional()
    .isBoolean()
    .withMessage('isEnabled debe ser un booleano'),
  body('isDailyReminderEnabled')
    .optional()
    .isBoolean()
    .withMessage('isDailyReminderEnabled debe ser un booleano'),
  handleInputErrors,
  NotificationController.setTaskPreference
);

/**
 * Eliminar preferencia de notificación para una tarea
 * DELETE /api/notifications/tasks/:taskId/preference
 */
router.delete(
  '/tasks/:taskId/preference',
  param('taskId').isMongoId().withMessage('ID de tarea inválido'),
  handleInputErrors,
  NotificationController.removeTaskPreference
);

/**
 * Activar/desactivar todas las notificaciones del usuario
 * PATCH /api/notifications/toggle-all
 */
router.patch(
  '/toggle-all',
  body('isEnabled')
    .isBoolean()
    .withMessage('isEnabled debe ser un booleano'),
  handleInputErrors,
  NotificationController.toggleAllNotifications
);

/**
 * Activar/desactivar recordatorios diarios para todas las tareas del usuario
 * PATCH /api/notifications/toggle-daily-reminders
 */
router.patch(
  '/toggle-daily-reminders',
  body('isDailyReminderEnabled')
    .isBoolean()
    .withMessage('isDailyReminderEnabled debe ser un booleano'),
  handleInputErrors,
  NotificationController.toggleAllDailyReminders
);

/**
 * Enviar recordatorio de prueba para una tarea
 * POST /api/notifications/tasks/:taskId/test
 */
router.post(
  '/tasks/:taskId/test',
  param('taskId').isMongoId().withMessage('ID de tarea inválido'),
  handleInputErrors,
  NotificationController.sendTestReminder
);

export default router;

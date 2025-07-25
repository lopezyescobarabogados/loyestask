import type { Request, Response } from "express";
import NotificationPreference from "../models/NotificationPreference";
import Task from "../models/Task";
import { NotificationService } from "../services/NotificationService";

export class NotificationController {
  /**
   * Obtener preferencias de notificación del usuario
   */
  static async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;

      const preferences = await NotificationPreference.find({ user: userId })
        .populate({
          path: 'task',
          select: 'name description dueDate status project',
          populate: {
            path: 'project',
            select: 'projectName clientName',
          },
        })
        .sort({ createdAt: -1 });

      res.json(preferences);
    } catch (error) {
      console.error('Error al obtener preferencias:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Crear o actualizar preferencia de notificación
   */
  static async setTaskPreference(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { reminderDays, isEnabled = true, isDailyReminderEnabled = false } = req.body;
      const userId = req.user.id;

      // Validar que reminderDays sea un número válido
      if (typeof reminderDays !== 'number' || reminderDays < 0 || reminderDays > 30) {
        res.status(400).json({ 
          error: 'Los días de recordatorio deben ser un número entre 0 y 30' 
        });
        return;
      }

      // Validar que isDailyReminderEnabled sea un booleano
      if (typeof isDailyReminderEnabled !== 'boolean') {
        res.status(400).json({ 
          error: 'El campo isDailyReminderEnabled debe ser un booleano' 
        });
        return;
      }

      // Verificar que la tarea existe y el usuario tiene acceso
      const task = await Task.findById(taskId).populate('project');
      if (!task) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }

      // Verificar acceso del usuario a la tarea (a través del proyecto)
      const project = task.project as any;
      const hasAccess = project.manager.toString() === userId || 
                       project.team.some((member: any) => member.toString() === userId);

      if (!hasAccess) {
        res.status(403).json({ error: 'No tienes acceso a esta tarea' });
        return;
      }

      // Crear o actualizar la preferencia
      const preference = await NotificationPreference.findOneAndUpdate(
        { user: userId, task: taskId },
        { 
          reminderDays, 
          isEnabled,
          isDailyReminderEnabled,
          // Reset lastSentAt when updating preferences
          $unset: { lastSentAt: 1, lastDailyReminderAt: 1 }
        },
        { 
          new: true, 
          upsert: true,
          runValidators: true 
        }
      ).populate({
        path: 'task',
        select: 'name description dueDate status project',
        populate: {
          path: 'project',
          select: 'projectName clientName',
        },
      });

      res.json({
        message: 'Preferencia de notificación actualizada correctamente',
        preference,
      });
    } catch (error) {
      console.error('Error al configurar preferencia:', error);
      
      if (error.name === 'ValidationError') {
        res.status(400).json({ 
          error: 'Datos de entrada inválidos',
          details: error.message 
        });
        return;
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Eliminar preferencia de notificación
   */
  static async removeTaskPreference(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      const preference = await NotificationPreference.findOneAndDelete({
        user: userId,
        task: taskId,
      });

      if (!preference) {
        res.status(404).json({ error: 'Preferencia no encontrada' });
        return;
      }

      res.json({ message: 'Preferencia de notificación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar preferencia:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener preferencia específica para una tarea
   */
  static async getTaskPreference(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      const preference = await NotificationPreference.findOne({
        user: userId,
        task: taskId,
      }).populate({
        path: 'task',
        select: 'name description dueDate status project',
        populate: {
          path: 'project',
          select: 'projectName clientName',
        },
      });

      if (!preference) {
        res.status(404).json({ error: 'Preferencia no encontrada' });
        return;
      }

      res.json(preference);
    } catch (error) {
      console.error('Error al obtener preferencia:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener resumen de notificaciones del usuario
   */
  static async getNotificationSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;

      const total = await NotificationPreference.countDocuments({ user: userId });
      const enabled = await NotificationPreference.countDocuments({ 
        user: userId, 
        isEnabled: true 
      });
      const dailyEnabled = await NotificationPreference.countDocuments({ 
        user: userId, 
        isDailyReminderEnabled: true 
      });
      const recentlySent = await NotificationPreference.countDocuments({
        user: userId,
        isEnabled: true,
        lastSentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 días
      });
      const dailyRecentlySent = await NotificationPreference.countDocuments({
        user: userId,
        isDailyReminderEnabled: true,
        lastDailyReminderAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 días
      });

      res.json({
        total,
        enabled,
        disabled: total - enabled,
        dailyEnabled,
        recentlySent,
        dailyRecentlySent,
      });
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Enviar recordatorio de prueba (solo para testing)
   */
  static async sendTestReminder(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      const notificationService = NotificationService.getInstance();
      const sent = await notificationService.sendTestReminder(userId, taskId);

      if (!sent) {
        res.status(404).json({ 
          error: 'No se pudo enviar el recordatorio. Verifica que la preferencia esté configurada.' 
        });
        return;
      }

      res.json({ message: 'Recordatorio de prueba enviado correctamente' });
    } catch (error) {
      console.error('Error al enviar recordatorio de prueba:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Activar/desactivar todas las notificaciones del usuario
   */
  static async toggleAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { isEnabled } = req.body;
      const userId = req.user.id;

      if (typeof isEnabled !== 'boolean') {
        res.status(400).json({ 
          error: 'El campo isEnabled debe ser un booleano' 
        });
        return;
      }

      const result = await NotificationPreference.updateMany(
        { user: userId },
        { 
          isEnabled,
          // Reset lastSentAt when re-enabling
          ...(isEnabled && { $unset: { lastSentAt: 1 } })
        }
      );

      res.json({
        message: `Se ${isEnabled ? 'activaron' : 'desactivaron'} todas las notificaciones correctamente`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error('Error al modificar notificaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Activar/desactivar recordatorios diarios para todas las tareas del usuario
   */
  static async toggleAllDailyReminders(req: Request, res: Response): Promise<void> {
    try {
      const { isDailyReminderEnabled } = req.body;
      const userId = req.user.id;

      if (typeof isDailyReminderEnabled !== 'boolean') {
        res.status(400).json({ 
          error: 'El campo isDailyReminderEnabled debe ser un booleano' 
        });
        return;
      }

      const result = await NotificationPreference.updateMany(
        { user: userId },
        { 
          isDailyReminderEnabled,
          // Reset lastDailyReminderAt when re-enabling
          ...(isDailyReminderEnabled && { $unset: { lastDailyReminderAt: 1 } })
        }
      );

      res.json({
        message: `Se ${isDailyReminderEnabled ? 'activaron' : 'desactivaron'} todos los recordatorios diarios correctamente`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error('Error al modificar recordatorios diarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

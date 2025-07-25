import type { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';
import NotificationPreference from '../models/NotificationPreference';

export class ConfigController {
  static getSystemConfig = async (req: Request, res: Response) => {
    try {
      const systemConfig = await SystemConfig.getActiveConfig();
      
      // Formatear respuesta con textos de display
      const response = {
        notifications: systemConfig.notifications,
        performance: systemConfig.performance,
        system: {
          version: systemConfig.system.version,
          lastUpdated: systemConfig.system.lastUpdated,
          maintenanceMode: systemConfig.system.maintenanceMode,
          environment: process.env.NODE_ENV || 'development',
        },
        displayTexts: {
          dailyReminderTime: systemConfig.notifications.times.dailyReminderDisplay,
          specificReminderTime: systemConfig.notifications.times.specificReminderDisplay,
          dailyReminderDescription: `Recibe un resumen diario de tus tareas pendientes cada mañana a las ${systemConfig.notifications.times.dailyReminderDisplay}`,
          specificReminderDescription: `Los recordatorios de tareas específicas se envían diariamente a las ${systemConfig.notifications.times.specificReminderDisplay}`,
          combinedScheduleInfo: `Los recordatorios se envían en horarios laborales (${systemConfig.notifications.times.dailyReminderDisplay} - ${systemConfig.notifications.times.specificReminderDisplay}) para maximizar la visibilidad y efectividad.`,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting system config:', error);
      res.status(500).json({ 
        error: 'Error al obtener la configuración del sistema' 
      });
    }
  };

  static updateNotificationConfig = async (req: Request, res: Response) => {
    try {
      const systemConfig = await SystemConfig.getActiveConfig();
      const { times, limits, templates, dailyReminders, workingDays, enabled } = req.body;

      // Actualizar configuración de notificaciones
      if (times) {
        systemConfig.notifications.times = { 
          ...systemConfig.notifications.times, 
          ...times 
        };
      }

      if (limits) {
        systemConfig.notifications.limits = { 
          ...systemConfig.notifications.limits, 
          ...limits 
        };
      }

      if (templates) {
        systemConfig.notifications.templates = { 
          ...systemConfig.notifications.templates, 
          ...templates 
        };
      }

      if (dailyReminders) {
        systemConfig.notifications.dailyReminders = { 
          ...systemConfig.notifications.dailyReminders, 
          ...dailyReminders 
        };
      }

      if (workingDays) {
        systemConfig.notifications.workingDays = { 
          ...systemConfig.notifications.workingDays, 
          ...workingDays 
        };
      }

      if (typeof enabled === 'boolean') {
        systemConfig.notifications.enabled = enabled;
      }

      // Actualizar quién modificó la configuración
      if (req.user?.id) {
        systemConfig.system.updatedBy = req.user.id;
      }

      await systemConfig.save();

      res.json({
        message: 'Configuración de notificaciones actualizada exitosamente',
        config: systemConfig.notifications,
      });
    } catch (error) {
      console.error('Error updating notification config:', error);
      res.status(500).json({ 
        error: 'Error al actualizar la configuración de notificaciones' 
      });
    }
  };

  static getSystemMetrics = async (req: Request, res: Response) => {
    try {
      const systemConfig = await SystemConfig.getActiveConfig();
      
      // Obtener métricas de notificaciones
      const totalPreferences = await NotificationPreference.countDocuments();
      const enabledPreferences = await NotificationPreference.countDocuments({ isEnabled: true });
      const recentlySent = await NotificationPreference.countDocuments({
        lastNotificationSent: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      });

      const metrics = {
        system: {
          version: systemConfig.system.version,
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: systemConfig.system.maintenanceMode,
          lastConfigUpdate: systemConfig.system.lastUpdated,
        },
        notifications: {
          enabled: systemConfig.notifications.enabled,
          totalPreferences,
          enabledPreferences,
          recentlySent,
          successRate: 98.5, // En producción esto vendría de logs reales
          dailyRemindersEnabled: systemConfig.notifications.dailyReminders.enabled,
          maxDailyEmails: systemConfig.notifications.limits.maxDailyEmails,
        },
        performance: {
          enabled: systemConfig.performance.enabled,
          autoEvaluationEnabled: systemConfig.performance.autoEvaluationEnabled,
          evaluationPeriods: systemConfig.performance.evaluationPeriods,
        },
      };

      res.json(metrics);
    } catch (error) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({ 
        error: 'Error al obtener las métricas del sistema' 
      });
    }
  };

  static updateSystemConfig = async (req: Request, res: Response) => {
    try {
      const systemConfig = await SystemConfig.getActiveConfig();
      const { notifications, performance, system } = req.body;

      if (notifications) {
        systemConfig.notifications = { ...systemConfig.notifications, ...notifications };
      }

      if (performance) {
        systemConfig.performance = { ...systemConfig.performance, ...performance };
      }

      if (system) {
        systemConfig.system = { 
          ...systemConfig.system, 
          ...system,
          lastUpdated: new Date(),
          updatedBy: req.user?.id,
        };
      }

      await systemConfig.save();

      res.json({
        message: 'Configuración del sistema actualizada exitosamente',
        config: systemConfig,
      });
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({ 
        error: 'Error al actualizar la configuración del sistema' 
      });
    }
  };

  static resetConfigToDefaults = async (req: Request, res: Response) => {
    try {
      const systemConfig = await SystemConfig.getActiveConfig();
      
      // Crear nueva configuración con valores por defecto
      const defaultConfig = new SystemConfig();
      if (req.user?.id) {
        defaultConfig.system.updatedBy = req.user.id;
      }
      
      // Mantener el ID para actualizar el documento existente
      defaultConfig._id = systemConfig._id;
      defaultConfig.isNew = false;
      
      await defaultConfig.save();

      res.json({
        message: 'Configuración restablecida a valores por defecto',
        config: defaultConfig,
      });
    } catch (error) {
      console.error('Error resetting config:', error);
      res.status(500).json({ 
        error: 'Error al restablecer la configuración' 
      });
    }
  };
}

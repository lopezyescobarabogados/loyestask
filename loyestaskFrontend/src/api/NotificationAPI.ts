import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import type { NotificationPreference, CreateNotificationPreference, NotificationSummary } from '@/types/index';

/**
 * Obtener todas las preferencias de notificación del usuario
 */
export async function getUserNotificationPreferences(): Promise<NotificationPreference[]> {
  try {
    const { data } = await api.get<NotificationPreference[]>('/notifications/preferences');
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener preferencias de notificación');
  }
}

/**
 * Obtener resumen de notificaciones del usuario
 */
export async function getNotificationSummary(): Promise<NotificationSummary> {
  try {
    const { data } = await api.get<NotificationSummary>('/notifications/summary');
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener resumen de notificaciones');
  }
}

/**
 * Obtener preferencia de notificación para una tarea específica
 */
export async function getTaskNotificationPreference(taskId: string): Promise<NotificationPreference> {
  try {
    const { data } = await api.get<NotificationPreference>(`/notifications/tasks/${taskId}/preference`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener preferencia de notificación');
  }
}

/**
 * Configurar preferencia de notificación para una tarea
 */
export async function setTaskNotificationPreference(
  taskId: string, 
  preference: CreateNotificationPreference
): Promise<{ message: string; preference: NotificationPreference }> {
  try {
    const { data } = await api.post(`/notifications/tasks/${taskId}/preference`, preference);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al configurar preferencia de notificación');
  }
}

/**
 * Actualizar preferencia de notificación para una tarea
 */
export async function updateTaskNotificationPreference(
  taskId: string, 
  preference: Partial<CreateNotificationPreference>
): Promise<{ message: string; preference: NotificationPreference }> {
  try {
    const { data } = await api.put(`/notifications/tasks/${taskId}/preference`, preference);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al actualizar preferencia de notificación');
  }
}

/**
 * Eliminar preferencia de notificación para una tarea
 */
export async function removeTaskNotificationPreference(taskId: string): Promise<string> {
  try {
    const { data } = await api.delete(`/notifications/tasks/${taskId}/preference`);
    return data.message;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al eliminar preferencia de notificación');
  }
}

/**
 * Activar/desactivar todas las notificaciones del usuario
 */
export async function toggleAllNotifications(isEnabled: boolean): Promise<{ message: string; modifiedCount: number }> {
  try {
    const { data } = await api.patch('/notifications/toggle-all', { isEnabled });
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al modificar notificaciones');
  }
}

/**
 * Activar/desactivar recordatorios diarios para todas las tareas del usuario
 */
export async function toggleAllDailyReminders(isDailyReminderEnabled: boolean): Promise<{ message: string; modifiedCount: number }> {
  try {
    const { data } = await api.patch('/notifications/toggle-daily-reminders', { isDailyReminderEnabled });
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al modificar recordatorios diarios');
  }
}

/**
 * Enviar recordatorio de prueba para una tarea
 */
export async function sendTestReminder(taskId: string): Promise<string> {
  try {
    const { data } = await api.post(`/notifications/tasks/${taskId}/test`);
    return data.message;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al enviar recordatorio de prueba');
  }
}

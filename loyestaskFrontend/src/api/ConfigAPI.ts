import api from '@/lib/axios';

interface FrontendConfig {
  notifications: {
    schedules: {
      dailyReminderHour: number;
      specificReminderHour: number;
    };
    times: {
      dailyReminderDisplay: string;
      specificReminderDisplay: string;
    };
    limits: {
      maxDailyEmails: number;
    };
    templates: {
      subjectPrefix: string;
      greeting: string;
    };
    features: {
      enableDailyReminders: boolean;
      enableSpecificReminders: boolean;
    };
  };
  ui: {
    dateFormat: string;
    timeFormat: string;
    locale: string;
  };
  system: {
    environment: string;
    version: string;
  };
}

// Obtener configuración del sistema
export const getSystemConfig = async (): Promise<FrontendConfig> => {
  const { data } = await api.get('/config/system');
  return data.data;
};

// Actualizar configuración de notificaciones (solo admin)
export const updateNotificationConfig = async (config: {
  dailyReminderHour?: number;
  specificReminderHour?: number;
  maxDailyEmails?: number;
  subjectPrefix?: string;
  greeting?: string;
  enableDailyReminders?: boolean;
  enableSpecificReminders?: boolean;
}) => {
  const { data } = await api.put('/config/notifications', config);
  return data;
};

// Obtener métricas del sistema (solo admin)
export const getSystemMetrics = async () => {
  const { data } = await api.get('/config/metrics');
  return data.data;
};

// Probar sistema de notificaciones
export const testNotificationSystem = async (type: 'specific' | 'daily' = 'specific') => {
  const { data } = await api.post('/config/test-notifications', { type });
  return data;
};

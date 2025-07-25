// Configuración dinámica del frontend
export interface FrontendConfig {
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

// Configuración por defecto que puede ser sobrescrita por el backend
const defaultConfig: FrontendConfig = {
  notifications: {
    schedules: {
      dailyReminderHour: 8,
      specificReminderHour: 9,
    },
    times: {
      dailyReminderDisplay: '8:00 AM',
      specificReminderDisplay: '9:00 AM',
    },
    limits: {
      maxDailyEmails: 1000,
    },
    templates: {
      subjectPrefix: 'LoyesTask',
      greeting: 'Hola',
    },
    features: {
      enableDailyReminders: true,
      enableSpecificReminders: true,
    },
  },
  ui: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    locale: 'es-ES',
  },
  system: {
    environment: import.meta.env.MODE || 'development',
    version: '1.0.0',
  },
};

// Estado global de configuración
let currentConfig: FrontendConfig = { ...defaultConfig };

// Función para formatear hora en formato AM/PM
export const formatHourAMPM = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${ampm}`;
};

// Función para formatear hora en formato 24h
export const formatHour24 = (hour: number): string => {
  return hour.toString().padStart(2, '0') + ':00';
};

// Actualizar configuración desde el backend
export const updateConfigFromBackend = (backendConfig: Partial<FrontendConfig>): void => {
  currentConfig = {
    ...currentConfig,
    ...backendConfig,
    notifications: {
      ...currentConfig.notifications,
      ...backendConfig.notifications,
      times: {
        dailyReminderDisplay: formatHourAMPM(
          backendConfig.notifications?.schedules?.dailyReminderHour || 
          currentConfig.notifications.schedules.dailyReminderHour
        ),
        specificReminderDisplay: formatHourAMPM(
          backendConfig.notifications?.schedules?.specificReminderHour || 
          currentConfig.notifications.schedules.specificReminderHour
        ),
      },
    },
  };
};

// Obtener configuración actual
export const getConfig = (): FrontendConfig => currentConfig;

// Obtener configuración de notificaciones
export const getNotificationConfig = () => currentConfig.notifications;

// Obtener configuración de UI
export const getUIConfig = () => currentConfig.ui;

// Funciones de utilidad para componentes
export const getDisplayTexts = () => ({
  dailyReminderTime: currentConfig.notifications.times.dailyReminderDisplay,
  specificReminderTime: currentConfig.notifications.times.specificReminderDisplay,
  dailyReminderDescription: `Recibe un resumen diario de tus tareas pendientes cada mañana a las ${currentConfig.notifications.times.dailyReminderDisplay}`,
  specificReminderDescription: `Los recordatorios de tareas específicas se envían diariamente a las ${currentConfig.notifications.times.specificReminderDisplay}`,
  combinedScheduleInfo: `Los recordatorios se envían en horarios laborales (${currentConfig.notifications.times.dailyReminderDisplay} - ${currentConfig.notifications.times.specificReminderDisplay}) para maximizar la visibilidad y efectividad.`,
});

export default currentConfig;

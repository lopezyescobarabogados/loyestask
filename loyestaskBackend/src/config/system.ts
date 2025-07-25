// Sistema de configuración centralizado para el backend
import dotenv from 'dotenv';

dotenv.config();

export interface NotificationConfig {
  schedules: {
    dailyReminders: string;
    specificReminders: string;
  };
  times: {
    dailyReminderHour: number;
    specificReminderHour: number;
  };
  limits: {
    maxDailyEmails: number;
    maxRetries: number;
    batchSize: number;
  };
  templates: {
    subjectPrefix: string;
    greeting: string;
    signature: string;
  };
  features: {
    enableDailyReminders: boolean;
    enableSpecificReminders: boolean;
    enableTestMode: boolean;
  };
}

export interface SystemConfig {
  server: {
    port: number;
    environment: string;
    corsWhitelist: string[];
  };
  database: {
    url: string;
    testUrl: string;
    maxConnections: number;
  };
  email: {
    service: string;
    host?: string;
    port?: number;
    secure?: boolean;
    user: string;
    password: string;
    from: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  notifications: NotificationConfig;
}

const config: SystemConfig = {
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    environment: process.env.NODE_ENV || 'development',
    corsWhitelist: process.env.CORS_WHITELIST?.split(',') || [
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/loyestask',
    testUrl: process.env.DATABASE_TEST_URL || 'mongodb://localhost:27017/loyestask_test',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'loyestask-secret-key-development',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  notifications: {
    schedules: {
      // Cron expressions - configurables via ENV
      dailyReminders: process.env.DAILY_REMINDERS_CRON || '0 8 * * *', // 8:00 AM daily
      specificReminders: process.env.SPECIFIC_REMINDERS_CRON || '0 9 * * *', // 9:00 AM daily
    },
    times: {
      dailyReminderHour: parseInt(process.env.DAILY_REMINDER_HOUR || '8', 10),
      specificReminderHour: parseInt(process.env.SPECIFIC_REMINDER_HOUR || '9', 10),
    },
    limits: {
      maxDailyEmails: parseInt(process.env.MAX_DAILY_EMAILS || '1000', 10),
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '50', 10),
    },
    templates: {
      subjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || 'LoyesTask',
      greeting: process.env.EMAIL_GREETING || 'Hola',
      signature: process.env.EMAIL_SIGNATURE || 'Equipo LoyesTask',
    },
    features: {
      enableDailyReminders: process.env.ENABLE_DAILY_REMINDERS !== 'false',
      enableSpecificReminders: process.env.ENABLE_SPECIFIC_REMINDERS !== 'false',
      enableTestMode: process.env.ENABLE_TEST_MODE === 'true',
    },
  },
};

// Validación de configuración crítica
function validateConfig(): void {
  const requiredFields = [
    'DATABASE_URL',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0 && config.server.environment === 'production') {
    throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
  }

  // Validar horarios
  if (config.notifications.times.dailyReminderHour < 0 || config.notifications.times.dailyReminderHour > 23) {
    throw new Error('DAILY_REMINDER_HOUR must be between 0 and 23');
  }

  if (config.notifications.times.specificReminderHour < 0 || config.notifications.times.specificReminderHour > 23) {
    throw new Error('SPECIFIC_REMINDER_HOUR must be between 0 and 23');
  }

  // Validar límites
  if (config.notifications.limits.maxDailyEmails < 1) {
    throw new Error('MAX_DAILY_EMAILS must be greater than 0');
  }
}

// Utilidades para formatear horarios
export const formatHour = (hour: number): string => {
  return hour.toString().padStart(2, '0') + ':00';
};

export const formatHourAMPM = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${ampm}`;
};

// Función para obtener configuración específica de notificaciones
export const getNotificationConfig = (): NotificationConfig => config.notifications;

// Función para obtener toda la configuración
export const getConfig = (): SystemConfig => config;

// Inicializar y validar configuración
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error);
  if (config.server.environment === 'production') {
    process.exit(1);
  }
}

export default config;

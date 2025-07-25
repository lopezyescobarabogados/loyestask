import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemConfig extends Document {
  notifications: {
    enabled: boolean;
    times: {
      dailyReminder: string;        // Formato 24h: "08:00"
      specificReminder: string;     // Formato 24h: "09:00"
      dailyReminderDisplay: string; // Formato display: "8:00 AM"
      specificReminderDisplay: string; // Formato display: "9:00 AM"
    };
    limits: {
      maxDailyEmails: number;
      maxWeeklyEmails: number;
      maxMonthlyEmails: number;
    };
    templates: {
      subject: string;
      greeting: string;
      footer: string;
    };
    dailyReminders: {
      enabled: boolean;
      weekendsIncluded: boolean;
      reminderThresholdDays: number;
    };
    workingDays: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
  };
  performance: {
    enabled: boolean;
    evaluationPeriods: string[];
    autoEvaluationEnabled: boolean;
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    version: string;
    lastUpdated: Date;
    updatedBy: mongoose.Types.ObjectId;
  };
}

export interface ISystemConfigModel extends Model<ISystemConfig> {
  getActiveConfig(): Promise<ISystemConfig>;
}

const SystemConfigSchema: Schema = new Schema({
  notifications: {
    enabled: {
      type: Boolean,
      default: true,
    },
    times: {
      dailyReminder: {
        type: String,
        default: '08:00',
        validate: {
          validator: function(v: string) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Hora debe estar en formato HH:MM (24 horas)'
        }
      },
      specificReminder: {
        type: String,
        default: '09:00',
        validate: {
          validator: function(v: string) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Hora debe estar en formato HH:MM (24 horas)'
        }
      },
      dailyReminderDisplay: {
        type: String,
        default: '8:00 AM',
      },
      specificReminderDisplay: {
        type: String,
        default: '9:00 AM',
      },
    },
    limits: {
      maxDailyEmails: {
        type: Number,
        default: 100,
        min: [1, 'Debe permitir al menos 1 email por día'],
        max: [10000, 'Límite máximo de 10,000 emails por día'],
      },
      maxWeeklyEmails: {
        type: Number,
        default: 500,
        min: [1, 'Debe permitir al menos 1 email por semana'],
      },
      maxMonthlyEmails: {
        type: Number,
        default: 2000,
        min: [1, 'Debe permitir al menos 1 email por mes'],
      },
    },
    templates: {
      subject: {
        type: String,
        default: 'Recordatorio de Tareas - LoyesTask',
        maxlength: [200, 'El asunto no puede exceder 200 caracteres'],
      },
      greeting: {
        type: String,
        default: 'Hola',
        maxlength: [100, 'El saludo no puede exceder 100 caracteres'],
      },
      footer: {
        type: String,
        default: 'Saludos,\nEl equipo de LoyesTask',
        maxlength: [500, 'El pie de página no puede exceder 500 caracteres'],
      },
    },
    dailyReminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
      weekendsIncluded: {
        type: Boolean,
        default: false,
      },
      reminderThresholdDays: {
        type: Number,
        default: 7,
        min: [1, 'Mínimo 1 día de anticipación'],
        max: [30, 'Máximo 30 días de anticipación'],
      },
    },
    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
    },
  },
  performance: {
    enabled: {
      type: Boolean,
      default: true,
    },
    evaluationPeriods: {
      type: [String],
      default: ['monthly', 'quarterly', 'yearly'],
      validate: {
        validator: function(v: string[]) {
          const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
          return v.every(period => validPeriods.includes(period));
        },
        message: 'Períodos válidos: weekly, monthly, quarterly, yearly'
      }
    },
    autoEvaluationEnabled: {
      type: Boolean,
      default: false,
    },
  },
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'Sistema en mantenimiento. Por favor, intenta más tarde.',
      maxlength: [500, 'El mensaje de mantenimiento no puede exceder 500 caracteres'],
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
}, {
  timestamps: true,
});

// Middleware para actualizar campos automáticamente
SystemConfigSchema.pre('save', function(this: ISystemConfig, next) {
  if (this.isModified('notifications.times.dailyReminder')) {
    this.notifications.times.dailyReminderDisplay = formatHourToAMPM(this.notifications.times.dailyReminder);
  }
  if (this.isModified('notifications.times.specificReminder')) {
    this.notifications.times.specificReminderDisplay = formatHourToAMPM(this.notifications.times.specificReminder);
  }
  this.system.lastUpdated = new Date();
  next();
});

// Función auxiliar para formatear horas
function formatHourToAMPM(hour24: string): string {
  const [hours, minutes] = hour24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Índices para optimización
SystemConfigSchema.index({ 'system.lastUpdated': -1 });
SystemConfigSchema.index({ 'notifications.enabled': 1 });

// Método para obtener la configuración activa
SystemConfigSchema.statics.getActiveConfig = async function() {
  let config = await this.findOne().sort({ 'system.lastUpdated': -1 });
  
  if (!config) {
    // Crear configuración por defecto si no existe
    config = new this({});
    await config.save();
  }
  
  return config;
};

// Método para actualizar configuración específica
SystemConfigSchema.methods.updateNotificationConfig = function(notificationConfig: any) {
  this.notifications = { ...this.notifications.toObject(), ...notificationConfig };
  return this.save();
};

export default mongoose.model<ISystemConfig, ISystemConfigModel>('SystemConfig', SystemConfigSchema);

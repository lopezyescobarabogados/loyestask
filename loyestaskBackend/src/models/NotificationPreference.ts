import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotificationPreference extends Document {
  user: Types.ObjectId;
  task: Types.ObjectId;
  reminderDays: number; // Días antes del dueDate para enviar recordatorio
  isEnabled: boolean;
  isDailyReminderEnabled: boolean; // Nueva opción para recordatorios diarios
  lastSentAt?: Date;
  lastDailyReminderAt?: Date; // Último recordatorio diario enviado
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema: Schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: Types.ObjectId,
      ref: "Task",
      required: true,
    },
    reminderDays: {
      type: Number,
      required: true,
      min: 0,
      max: 30, // Máximo 30 días de anticipación
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    isDailyReminderEnabled: {
      type: Boolean,
      default: false, // Por defecto deshabilitado
    },
    lastSentAt: {
      type: Date,
    },
    lastDailyReminderAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para evitar duplicados y optimizar consultas
notificationPreferenceSchema.index({ user: 1, task: 1 }, { unique: true });

// Índice para optimizar consultas de recordatorios pendientes
notificationPreferenceSchema.index({ 
  isEnabled: 1, 
  reminderDays: 1,
  lastSentAt: 1 
});

// Índice para recordatorios diarios
notificationPreferenceSchema.index({
  isDailyReminderEnabled: 1,
  lastDailyReminderAt: 1
});

const NotificationPreference = mongoose.model<INotificationPreference>(
  "NotificationPreference",
  notificationPreferenceSchema
);

export default NotificationPreference;

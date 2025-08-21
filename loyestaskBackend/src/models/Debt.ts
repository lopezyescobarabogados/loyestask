import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";
import { IClient } from "./Client";

const debtStatus = {
  PENDING: "pending",       // Pendiente de pago
  PARTIAL: "partial",       // Parcialmente pagada
  PAID: "paid",            // Completamente pagada
  OVERDUE: "overdue",      // Vencida
  CANCELLED: "cancelled"   // Cancelada
} as const;

const debtPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
} as const;

export type DebtStatus = (typeof debtStatus)[keyof typeof debtStatus];
export type DebtPriority = (typeof debtPriority)[keyof typeof debtPriority];

export interface IDebt extends Document {
  debtNumber: string;       // Número único de deuda
  client: PopulatedDoc<IClient & Document>;
  description: string;
  totalAmount: number;      // Monto total de la deuda
  paidAmount: number;       // Monto ya pagado
  remainingAmount: number;  // Monto pendiente
  status: DebtStatus;
  priority: DebtPriority;
  dueDate: Date;           // Fecha límite de pago
  issueDate: Date;         // Fecha de emisión
  notificationDate?: Date; // Fecha de última notificación
  paymentTerms: number;    // Días de plazo para pago
  interestRate?: number;   // Tasa de interés mensual por mora (%)
  notes?: string;
  attachments: string[];   // Archivos adjuntos
  emailNotifications: boolean; // Si se envían notificaciones por email
  createdBy: PopulatedDoc<IUser & Document>;
  
  // Métodos para cálculo de interés mensual
  calculateMonthlyInterest(monthsOverdue: number): number;
  getMonthsOverdue(): number;
  getTotalAmountWithInterest(): number;
}

const DebtSchema: Schema = new Schema(
  {
    debtNumber: {
      type: String,
      trim: true,  // Removido unique: true para evitar duplicación con índice manual
      // No requerido explícitamente ya que se genera automáticamente
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(debtStatus),
      default: debtStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(debtPriority),
      default: debtPriority.MEDIUM,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    notificationDate: {
      type: Date,
    },
    paymentTerms: {
      type: Number,
      default: 30,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String,
    }],
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware combinado para cálculos y generación de debtNumber antes de guardar
DebtSchema.pre('save', async function(next) {
  try {
    // Generar número único de deuda si es un documento nuevo y no tiene debtNumber
    if (this.isNew && !this.debtNumber) {
      const count = await mongoose.model('Debt').countDocuments();
      this.debtNumber = `DEBT-${String(count + 1).padStart(6, '0')}`;
      console.log('🔢 Número de deuda generado:', this.debtNumber);
    }

    // Calcular remainingAmount y actualizar status si los montos han cambiado
    if (this.isModified('totalAmount') || this.isModified('paidAmount') || this.isNew) {
      const totalAmount = this.totalAmount as number;
      const paidAmount = this.paidAmount as number;
      const remainingAmount = totalAmount - paidAmount;
      this.remainingAmount = remainingAmount;
      
      // Actualizar status basado en los pagos
      if (remainingAmount <= 0) {
        this.status = debtStatus.PAID;
      } else if (paidAmount > 0) {
        this.status = debtStatus.PARTIAL;
      } else if (new Date() > this.dueDate) {
        this.status = debtStatus.OVERDUE;
      } else {
        this.status = debtStatus.PENDING;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware pre-save de Debt:', error);
    next(error);
  }
});

// Métodos para calcular interés mensual
DebtSchema.methods.calculateMonthlyInterest = function(monthsOverdue: number): number {
  if (!this.interestRate || this.interestRate <= 0 || monthsOverdue <= 0) {
    return 0;
  }
  
  // Interés mensual = (monto pendiente * tasa mensual * meses vencidos) / 100
  const monthlyInterestAmount = (this.remainingAmount * this.interestRate * monthsOverdue) / 100;
  return Math.round(monthlyInterestAmount);
};

DebtSchema.methods.getMonthsOverdue = function(): number {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today <= dueDate) {
    return 0; // No está vencida
  }
  
  // Calcular diferencia en meses
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.ceil(diffDays / 30); // Aproximadamente 30 días por mes
  
  return diffMonths;
};

DebtSchema.methods.getTotalAmountWithInterest = function(): number {
  const monthsOverdue = this.getMonthsOverdue();
  const interestAmount = this.calculateMonthlyInterest(monthsOverdue);
  return this.remainingAmount + interestAmount;
};

// Índices para optimizar consultas
DebtSchema.index({ debtNumber: 1 });
DebtSchema.index({ client: 1 });
DebtSchema.index({ status: 1 });
DebtSchema.index({ dueDate: 1 });
DebtSchema.index({ createdBy: 1 });
DebtSchema.index({ 'client': 1, 'status': 1 });

const Debt = mongoose.model<IDebt>("Debt", DebtSchema);
export default Debt;

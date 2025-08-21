import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";

const periodStatus = {
  OPEN: "open",       // Período abierto (se pueden hacer modificaciones)
  CLOSED: "closed",   // Período cerrado (solo lectura)
} as const;

export type PeriodStatus = (typeof periodStatus)[keyof typeof periodStatus];

export interface IFinancialPeriod extends Document {
  year: number;
  month: number;
  status: PeriodStatus;
  closedBy?: PopulatedDoc<IUser & Document>;
  closedAt?: Date;
  totalInvoices: number;
  totalPayments: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

const FinancialPeriodSchema: Schema = new Schema(
  {
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    status: {
      type: String,
      enum: Object.values(periodStatus),
      default: periodStatus.OPEN,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: {
      type: Date,
    },
    totalInvoices: {
      type: Number,
      default: 0,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    netIncome: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índice único compuesto para año y mes
FinancialPeriodSchema.index({ year: 1, month: 1 }, { unique: true });
FinancialPeriodSchema.index({ status: 1 });

// Virtual para obtener el nombre del período
FinancialPeriodSchema.virtual('periodName').get(function() {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${months[(this.month as number) - 1]} ${this.year}`;
});

// Virtual para verificar si es el período actual
FinancialPeriodSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.year === now.getFullYear() && this.month === (now.getMonth() + 1);
});

// Middleware para calcular totales antes de cerrar
FinancialPeriodSchema.pre('save', async function() {
  if (this.isModified('status') && this.status === 'closed') {
    // Calcular totales del período
    const startDate = new Date(this.year as number, (this.month as number) - 1, 1);
    const endDate = new Date(this.year as number, this.month as number, 0, 23, 59, 59);

    const Invoice = mongoose.model('Invoice');
    const Payment = mongoose.model('Payment');

    // Contar facturas del período
    this.totalInvoices = await Invoice.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Contar pagos del período
    this.totalPayments = await Payment.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calcular ingresos totales
    const incomeResult = await Payment.aggregate([
      {
        $match: {
          type: 'income',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    this.totalIncome = incomeResult[0]?.total || 0;

    // Calcular gastos totales
    const expenseResult = await Payment.aggregate([
      {
        $match: {
          type: 'expense',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    this.totalExpenses = expenseResult[0]?.total || 0;

    // Calcular ingreso neto
    this.netIncome = (this.totalIncome as number) - (this.totalExpenses as number);

    // Marcar facturas y pagos como bloqueados
    await Invoice.updateMany(
      { createdAt: { $gte: startDate, $lte: endDate } },
      { isLocked: true }
    );

    await Payment.updateMany(
      { createdAt: { $gte: startDate, $lte: endDate } },
      { isLocked: true }
    );
  }
});

const FinancialPeriod = mongoose.model<IFinancialPeriod>("FinancialPeriod", FinancialPeriodSchema);
export default FinancialPeriod;

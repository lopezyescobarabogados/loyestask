import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";
import { IInvoice } from "./Invoice";
import { IAccount } from "./Account";

// Monedas permitidas
const allowedCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "COP", "MXN", "ARS"];

const paymentType = {
  INCOME: "income",     // Pago recibido (cobro)
  EXPENSE: "expense",   // Pago realizado (gasto)
} as const;

const paymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
} as const;

const paymentMethod = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CHECK: "check",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  TRANSFER: "transfer",
  OTHER: "other"
} as const;

export type PaymentType = (typeof paymentType)[keyof typeof paymentType];
export type PaymentStatus = (typeof paymentStatus)[keyof typeof paymentStatus];
export type PaymentMethod = (typeof paymentMethod)[keyof typeof paymentMethod];

export interface IPayment extends Document {
  paymentNumber: string;
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  paymentDate: Date;
  invoice?: PopulatedDoc<IInvoice & Document>;
  account: PopulatedDoc<IAccount & Document>;
  createdBy: PopulatedDoc<IUser & Document>;
  attachments: string[];
  notes?: string;
  isLocked: boolean; // Para períodos cerrados
}

const PaymentSchema: Schema = new Schema(
  {
    paymentNumber: {
      type: String,
      required: false, // Se genera automáticamente en el middleware
      trim: true,  // Removido unique: true para evitar duplicación con índice manual
      validate: {
        validator: function(value: string) {
          // Solo se valida si no es un documento nuevo o ya tiene valor
          return !this.isNew || !!value;
        },
        message: 'Payment number is required'
      }
    },
    type: {
      type: String,
      enum: Object.values(paymentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(paymentStatus),
      default: paymentStatus.PENDING,
    },
    method: {
      type: String,
      enum: Object.values(paymentMethod),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      trim: true,
      uppercase: true,
      enum: {
        values: allowedCurrencies,
        message: 'La moneda {VALUE} no está soportada'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [{
      type: String,
    }],
    notes: {
      type: String,
      trim: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para optimización
PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ type: 1, status: 1 });
PaymentSchema.index({ paymentDate: 1 });
PaymentSchema.index({ invoice: 1 });
PaymentSchema.index({ account: 1 });
PaymentSchema.index({ createdBy: 1 });
PaymentSchema.index({ isLocked: 1 });
// Índices compuestos para consultas comunes
PaymentSchema.index({ createdBy: 1, type: 1, status: 1 });
PaymentSchema.index({ account: 1, paymentDate: 1 });
PaymentSchema.index({ type: 1, paymentDate: 1 });

// Middleware para generar número de pago automáticamente
PaymentSchema.pre('save', async function() {
  if (this.isNew && !this.paymentNumber) {
    try {
      const year = new Date().getFullYear();
      const count = await mongoose.model('Payment').countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });
      
      const prefix = this.type === 'income' ? 'PAY-IN' : 'PAY-OUT';
      this.paymentNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating payment number:', error);
      // Fallback: generate a simple number
      const timestamp = Date.now();
      const prefix = this.type === 'income' ? 'PAY-IN' : 'PAY-OUT';
      this.paymentNumber = `${prefix}-${timestamp}`;
    }
  }
});

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;

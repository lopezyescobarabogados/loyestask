import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";

// Monedas permitidas
const allowedCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "COP", "MXN", "ARS"];

const invoiceType = {
  SENT: "sent",           // Factura enviada a cliente
  RECEIVED: "received",   // Factura recibida de proveedor
} as const;

const invoiceStatus = {
  DRAFT: "draft",         // Borrador
  SENT: "sent",          // Enviada
  PAID: "paid",          // Pagada
  OVERDUE: "overdue",    // Vencida
  CANCELLED: "cancelled" // Cancelada
} as const;

export type InvoiceType = (typeof invoiceType)[keyof typeof invoiceType];
export type InvoiceStatus = (typeof invoiceStatus)[keyof typeof invoiceStatus];

export interface IInvoice extends Document {
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  client: string;
  provider?: string;
  clientEmail?: string;
  description: string;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  createdBy: PopulatedDoc<IUser & Document>;
  attachments: string[];
  notes?: string;
  isLocked: boolean; // Para períodos cerrados
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,  // Removido unique: true para evitar duplicación con índice manual
    },
    type: {
      type: String,
      enum: Object.values(invoiceType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(invoiceStatus),
      default: invoiceStatus.DRAFT,
    },
    client: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email: string) {
          if (!email) return true; // Email es opcional
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'El formato del email no es válido'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    total: {
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
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
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
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ type: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });
InvoiceSchema.index({ createdBy: 1 });
InvoiceSchema.index({ isLocked: 1 });
// Índices compuestos para consultas comunes
InvoiceSchema.index({ createdBy: 1, type: 1, status: 1 });
InvoiceSchema.index({ createdBy: 1, dueDate: 1 });
InvoiceSchema.index({ type: 1, dueDate: 1, status: 1 });

// Virtual para verificar si está vencida
InvoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'paid' && this.status !== 'cancelled' && this.dueDate && this.dueDate < new Date();
});

// Virtual para días de mora
InvoiceSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') return 0;
  if (!this.dueDate || this.dueDate >= new Date()) return 0;
  
  const diffTime = new Date().getTime() - (this.dueDate as Date).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Middleware para generar número de factura automáticamente
InvoiceSchema.pre('save', async function() {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    
    const prefix = this.type === 'sent' ? 'INV' : 'REC';
    this.invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;

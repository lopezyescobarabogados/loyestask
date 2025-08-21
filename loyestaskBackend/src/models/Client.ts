import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";

const clientType = {
  INDIVIDUAL: "individual",     // Persona natural
  COMPANY: "company",          // Empresa
  GOVERNMENT: "government"     // Entidad gubernamental
} as const;

const clientStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BLOCKED: "blocked"
} as const;

export type ClientType = (typeof clientType)[keyof typeof clientType];
export type ClientStatus = (typeof clientStatus)[keyof typeof clientStatus];

export interface IClient extends Document {
  name: string;
  type: ClientType;
  status: ClientStatus;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;           // NIT, RUT, etc.
  contactPerson?: string;   // Para empresas
  notes?: string;
  totalDebt: number;        // Deuda total actual
  totalPaid: number;        // Total pagado históricamente
  creditLimit?: number;     // Límite de crédito
  paymentTerms: number;     // Días de pago (ej: 30 días)
  createdBy: PopulatedDoc<IUser & Document>;
}

const ClientSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(clientType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(clientStatus),
      default: clientStatus.ACTIVE,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    totalDebt: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: Number,
      default: 30, // 30 días por defecto
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

// Índices para optimizar consultas
ClientSchema.index({ name: 1 });
ClientSchema.index({ email: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdBy: 1 });

const Client = mongoose.model<IClient>("Client", ClientSchema);
export default Client;

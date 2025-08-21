import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";

// Monedas permitidas
const allowedCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "COP", "MXN", "ARS"];

const accountType = {
  BANK: "bank",         // Cuenta bancaria
  CASH: "cash",         // Caja
  CREDIT_CARD: "credit_card", // Tarjeta de crédito
  SAVINGS: "savings",   // Cuenta de ahorros
  OTHER: "other"        // Otra
} as const;

const accountStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  CLOSED: "closed"
} as const;

export type AccountType = (typeof accountType)[keyof typeof accountType];
export type AccountStatus = (typeof accountStatus)[keyof typeof accountStatus];

export interface IAccount extends Document {
  name: string;
  type: AccountType;
  status: AccountStatus;
  accountNumber?: string;
  bankName?: string;
  initialBalance: number;
  balance: number;
  currency: string;
  description?: string;
  createdBy: PopulatedDoc<IUser & Document>;
}

const AccountSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(accountType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(accountStatus),
      default: accountStatus.ACTIVE,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
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
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para optimización
AccountSchema.index({ name: 1 });
AccountSchema.index({ type: 1, status: 1 });
AccountSchema.index({ createdBy: 1 });

// Virtual para verificar si tiene saldo disponible
AccountSchema.virtual('hasBalance').get(function() {
  return (this.balance as number) > 0;
});

// Middleware para establecer saldo inicial
AccountSchema.pre('save', function() {
  if (this.isNew && this.balance === 0) {
    this.balance = this.initialBalance;
  }
});

const Account = mongoose.model<IAccount>("Account", AccountSchema);
export default Account;

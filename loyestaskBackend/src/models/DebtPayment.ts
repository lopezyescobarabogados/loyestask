import mongoose, { Schema, Document, PopulatedDoc } from "mongoose";
import { IUser } from "./User";
import { IClient } from "./Client";
import { IDebt } from "./Debt";
import { IAccount } from "./Account";

const debtPaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
} as const;

const debtPaymentMethod = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CHECK: "check",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  OTHER: "other"
} as const;

export type DebtPaymentStatus = (typeof debtPaymentStatus)[keyof typeof debtPaymentStatus];
export type DebtPaymentMethod = (typeof debtPaymentMethod)[keyof typeof debtPaymentMethod];

export interface IDebtPayment extends Document {
  paymentNumber: string;
  debt: PopulatedDoc<IDebt & Document>;
  client: PopulatedDoc<IClient & Document>;
  amount: number;
  status: DebtPaymentStatus;
  method: DebtPaymentMethod;
  paymentDate: Date;
  account: PopulatedDoc<IAccount & Document>;
  description?: string;
  attachments: string[];
  notes?: string;
  createdBy: PopulatedDoc<IUser & Document>;
}

const DebtPaymentSchema: Schema = new Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    debt: {
      type: Schema.Types.ObjectId,
      ref: "Debt",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(debtPaymentStatus),
      default: debtPaymentStatus.PENDING,
    },
    method: {
      type: String,
      enum: Object.values(debtPaymentMethod),
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String,
    }],
    notes: {
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
  }
);

// Generar número único de pago antes de guardar
DebtPaymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('DebtPayment').countDocuments();
    this.paymentNumber = `DP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Middleware para actualizar la deuda y cuenta cuando se confirma el pago
DebtPaymentSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === debtPaymentStatus.COMPLETED) {
    try {
      // Actualizar la deuda
      const Debt = mongoose.model('Debt');
      const debt = await Debt.findById(this.debt);
      if (debt) {
        debt.paidAmount = (debt.paidAmount as number) + (this.amount as number);
        await debt.save();
      }

      // Actualizar el cliente
      const Client = mongoose.model('Client');
      const client = await Client.findById(this.client);
      if (client) {
        client.totalPaid = (client.totalPaid as number) + (this.amount as number);
        client.totalDebt = (client.totalDebt as number) - (this.amount as number);
        await client.save();
      }

      // Actualizar el saldo de la cuenta
      const Account = mongoose.model('Account');
      const account = await Account.findById(this.account);
      if (account) {
        account.balance = (account.balance as number) + (this.amount as number);
        await account.save();
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Índices para optimizar consultas
DebtPaymentSchema.index({ paymentNumber: 1 });
DebtPaymentSchema.index({ debt: 1 });
DebtPaymentSchema.index({ client: 1 });
DebtPaymentSchema.index({ status: 1 });
DebtPaymentSchema.index({ paymentDate: 1 });
DebtPaymentSchema.index({ createdBy: 1 });

const DebtPayment = mongoose.model<IDebtPayment>("DebtPayment", DebtPaymentSchema);
export default DebtPayment;

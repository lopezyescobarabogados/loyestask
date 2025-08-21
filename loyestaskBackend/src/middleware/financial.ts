import type { Request, Response, NextFunction } from "express";
import Invoice from "../models/Invoice";
import Payment from "../models/Payment";
import Account from "../models/Account";
import FinancialPeriod from "../models/FinancialPeriod";

declare global {
  namespace Express {
    interface Request {
      invoice?: InstanceType<typeof Invoice>;
      payment?: InstanceType<typeof Payment>;
      account?: InstanceType<typeof Account>;
      fromAccount?: InstanceType<typeof Account>;
      toAccount?: InstanceType<typeof Account>;
      financialPeriod?: InstanceType<typeof FinancialPeriod>;
    }
  }
}

// Middleware para verificar si existe la factura
export const invoiceExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }
    
    req.invoice = invoice;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al verificar la factura" });
  }
};

// Middleware para verificar propiedad de la factura
export const invoiceOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.invoice && req.invoice.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "No tienes permisos para acceder a esta factura" });
  }
  
  next();
};

// Middleware para verificar si la factura está bloqueada
export const invoiceNotLocked = (req: Request, res: Response, next: NextFunction) => {
  if (req.invoice && req.invoice.isLocked) {
    return res.status(403).json({ 
      error: "No se puede modificar una factura de un período cerrado" 
    });
  }
  
  next();
};

// Middleware para verificar si existe el pago
export const paymentExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    
    req.payment = payment;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al verificar el pago" });
  }
};

// Middleware para verificar propiedad del pago
export const paymentOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.payment && req.payment.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "No tienes permisos para acceder a este pago" });
  }
  
  next();
};

// Middleware para verificar si el pago está bloqueado
export const paymentNotLocked = (req: Request, res: Response, next: NextFunction) => {
  if (req.payment && req.payment.isLocked) {
    return res.status(403).json({ 
      error: "No se puede modificar un pago de un período cerrado" 
    });
  }
  
  next();
};

// Middleware para verificar si existe la cuenta
export const accountExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.accountId || req.body.account;
    
    if (!accountId) {
      return res.status(400).json({ error: "ID de cuenta requerido" });
    }
    
    const account = await Account.findById(accountId);
    
    if (!account) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }
    
    req.account = account;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al verificar la cuenta" });
  }
};

// Middleware para verificar propiedad de la cuenta
export const accountOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.account && req.account.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "No tienes permisos para acceder a esta cuenta" });
  }
  
  next();
};

// Middleware para verificar si la cuenta está activa
export const accountActive = (req: Request, res: Response, next: NextFunction) => {
  if (req.account && req.account.status !== 'active') {
    return res.status(403).json({ error: "La cuenta no está activa" });
  }
  
  next();
};

// Middleware para verificar saldo suficiente
export const sufficientBalance = (amount: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.account && req.account.balance < amount) {
      return res.status(400).json({ error: "Saldo insuficiente en la cuenta" });
    }
    
    next();
  };
};

// Middleware para verificar si existe el período financiero
export const financialPeriodExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodId } = req.params;
    const period = await FinancialPeriod.findById(periodId);
    
    if (!period) {
      return res.status(404).json({ error: "Período financiero no encontrado" });
    }
    
    req.financialPeriod = period;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al verificar el período financiero" });
  }
};

// Middleware para verificar si el período está abierto
export const periodOpen = (req: Request, res: Response, next: NextFunction) => {
  if (req.financialPeriod && req.financialPeriod.status === 'closed') {
    return res.status(403).json({ error: "El período financiero está cerrado" });
  }
  
  next();
};

// Middleware para verificar si el período está cerrado
export const periodClosed = (req: Request, res: Response, next: NextFunction) => {
  if (req.financialPeriod && req.financialPeriod.status === 'open') {
    return res.status(400).json({ error: "El período financiero está abierto" });
  }
  
  next();
};

// Middleware para validar fechas de transacciones
export const validTransactionDate = (req: Request, res: Response, next: NextFunction) => {
  const { paymentDate, issueDate, dueDate } = req.body;
  const now = new Date();
  
  // Validar fecha de pago no sea futura
  if (paymentDate && new Date(paymentDate) > now) {
    return res.status(400).json({ error: "La fecha de pago no puede ser futura" });
  }
  
  // Validar fecha de vencimiento sea posterior a fecha de emisión
  if (issueDate && dueDate && new Date(dueDate) < new Date(issueDate)) {
    return res.status(400).json({ 
      error: "La fecha de vencimiento debe ser posterior a la fecha de emisión" 
    });
  }
  
  next();
};

// Middleware para validar montos financieros
export const validAmount = (req: Request, res: Response, next: NextFunction) => {
  const { amount, total } = req.body;
  const value = amount || total;
  
  if (value !== undefined) {
    if (typeof value !== 'number' || value < 0) {
      return res.status(400).json({ error: "El monto debe ser un número positivo" });
    }
    
    // Validar que no sea un monto excesivo (ej: más de 1 millón)
    if (value > 1000000) {
      return res.status(400).json({ error: "El monto excede el límite permitido" });
    }
  }
  
  next();
};

// Middleware para validar transferencias entre cuentas
export const validateTransferAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromAccountId, toAccountId } = req.body;
    
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ 
        error: "No se puede transferir a la misma cuenta" 
      });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);
    
    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: "Una o ambas cuentas no existen" });
    }

    // Verificar que ambas cuentas pertenezcan al usuario (excepto admin)
    if (req.user.role !== 'admin') {
      if (fromAccount.createdBy.toString() !== req.user.id || 
          toAccount.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ 
          error: "No tienes permisos para realizar transferencias con estas cuentas" 
        });
      }
    }

    // Verificar que ambas cuentas estén activas
    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      return res.status(403).json({ 
        error: "Ambas cuentas deben estar activas para realizar la transferencia" 
      });
    }

    // Verificar saldo suficiente
    if (fromAccount.balance < req.body.amount) {
      return res.status(400).json({ 
        error: "Saldo insuficiente en la cuenta origen" 
      });
    }

    // Agregar las cuentas al request para uso posterior
    req.fromAccount = fromAccount;
    req.toAccount = toAccount;
    
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al validar las cuentas para transferencia" });
  }
};

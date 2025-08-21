import type { Request, Response } from "express";
import Payment from "../models/Payment";
import Account from "../models/Account";
import Invoice from "../models/Invoice";

export class PaymentController {
  // Crear nuevo pago
  static createPayment = async (req: Request, res: Response) => {
    try {
      // Convertir paymentDate string a Date si es necesario
      const paymentData = { ...req.body };
      if (paymentData.paymentDate && typeof paymentData.paymentDate === 'string') {
        paymentData.paymentDate = new Date(paymentData.paymentDate);
      }

      const payment = new Payment({
        ...paymentData,
        createdBy: req.user.id,
      });

      await payment.save();

      // Actualizar balance de la cuenta
      if (payment.account) {
        const account = await Account.findById(payment.account);
        if (account) {
          if (payment.type === 'income') {
            account.balance += payment.amount;
          } else {
            account.balance -= payment.amount;
          }
          await account.save();
        }
      }

      // Si el pago está vinculado a una factura, actualizar su estado
      if (payment.invoice && payment.type === 'income') {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice && payment.status === 'completed') {
          invoice.status = 'paid';
          await invoice.save();
        }
      }

      res.status(201).json({
        msg: "Pago registrado correctamente",
        payment
      });
    } catch (error) {
      console.error('Error en createPayment:', error);
      res.status(500).json({ error: "Error al registrar el pago" });
    }
  };

  // Obtener todos los pagos
  static getPayments = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, type, status, account, method } = req.query;
      
      // Construir filtros
      const filter: any = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (account) filter.account = account;
      if (method) filter.method = method;

      const payments = await Payment.find(filter)
        .populate('createdBy', 'name email')
        .populate('account', 'name type')
        .populate('invoice', 'invoiceNumber type')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Payment.countDocuments(filter);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los pagos" });
    }
  };

  // Obtener pago por ID
  static getPaymentById = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      const payment = await Payment.findById(paymentId)
        .populate('createdBy', 'name email')
        .populate('account', 'name type balance')
        .populate('invoice', 'invoiceNumber type client provider total');

      if (!payment) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el pago" });
    }
  };

  // Actualizar pago
  static updatePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }

      // Verificar si el período está cerrado
      if (payment.isLocked) {
        return res.status(403).json({ 
          error: "No se puede modificar un pago de un período cerrado" 
        });
      }

      // Revertir cambios en balance si se cambia la cuenta o el monto
      if (payment.account && (req.body.account !== payment.account.toString() || req.body.amount !== payment.amount)) {
        const oldAccount = await Account.findById(payment.account);
        if (oldAccount) {
          if (payment.type === 'income') {
            oldAccount.balance -= payment.amount;
          } else {
            oldAccount.balance += payment.amount;
          }
          await oldAccount.save();
        }
      }

      // Guardar valores anteriores
      const oldAmount = payment.amount;
      const oldType = payment.type;
      const oldAccount = payment.account;

      // Actualizar pago
      Object.assign(payment, req.body);
      await payment.save();

      // Aplicar nuevos cambios en balance
      if (payment.account) {
        const newAccount = await Account.findById(payment.account);
        if (newAccount) {
          if (payment.type === 'income') {
            newAccount.balance += payment.amount;
          } else {
            newAccount.balance -= payment.amount;
          }
          await newAccount.save();
        }
      }

      res.json({
        msg: "Pago actualizado correctamente",
        payment
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar el pago" });
    }
  };

  // Cambiar estado de pago
  static updatePaymentStatus = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;
      
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }

      if (payment.isLocked) {
        return res.status(403).json({ 
          error: "No se puede modificar el estado de un pago de un período cerrado" 
        });
      }

      payment.status = status;
      await payment.save();

      // Si el pago se completa y está vinculado a una factura
      if (status === 'completed' && payment.invoice && payment.type === 'income') {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          invoice.status = 'paid';
          await invoice.save();
        }
      }

      res.json({
        msg: "Estado de pago actualizado correctamente",
        payment
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar el estado" });
    }
  };

  // Eliminar pago
  static deletePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }

      if (payment.isLocked) {
        return res.status(403).json({ 
          error: "No se puede eliminar un pago de un período cerrado" 
        });
      }

      // Revertir cambios en balance
      if (payment.account) {
        const account = await Account.findById(payment.account);
        if (account) {
          if (payment.type === 'income') {
            account.balance -= payment.amount;
          } else {
            account.balance += payment.amount;
          }
          await account.save();
        }
      }

      await Payment.findByIdAndDelete(paymentId);

      res.json({ msg: "Pago eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el pago" });
    }
  };

  // Obtener pagos por tipo
  static getPaymentsByType = async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: "Tipo de pago inválido" });
      }

      const payments = await Payment.find({ type })
        .populate('createdBy', 'name email')
        .populate('account', 'name type')
        .populate('invoice', 'invoiceNumber client provider')
        .sort({ createdAt: -1 });

      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los pagos" });
    }
  };

  // Obtener resumen de pagos
  static getPaymentsSummary = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const matchCondition: any = {};
      if (startDate && endDate) {
        matchCondition.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const summary = await Payment.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]);

      const totalPayments = await Payment.countDocuments(matchCondition);

      res.json({
        summary,
        totalPayments
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener resumen de pagos" });
    }
  };
}

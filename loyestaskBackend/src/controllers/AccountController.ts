import type { Request, Response } from "express";
import Account from "../models/Account";
import Payment from "../models/Payment";

export class AccountController {
  // Crear nueva cuenta
  static createAccount = async (req: Request, res: Response) => {
    try {
      const account = new Account({
        ...req.body,
        createdBy: req.user.id,
      });

      await account.save();
      
      res.status(201).json({
        msg: "Cuenta creada correctamente",
        account
      });
    } catch (error) {
      res.status(500).json({ error: "Error al crear la cuenta" });
    }
  };

  // Obtener todas las cuentas
  static getAccounts = async (req: Request, res: Response) => {
    try {
      const { type, status, page = 1, limit = 50, search } = req.query;
      
      // Construir filtros
      const filter: any = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      // Filtro de búsqueda por nombre o número de cuenta
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { accountNumber: { $regex: search, $options: 'i' } }
        ];
      }

      // Configurar paginación
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Obtener cuentas con paginación
      const accounts = await Account.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      // Obtener total para paginación
      const total = await Account.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        accounts,
        totalPages,
        currentPage: pageNum,
        total
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las cuentas" });
    }
  };

  // Obtener cuenta por ID
  static getAccountById = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      
      const account = await Account.findById(accountId)
        .populate('createdBy', 'name email');

      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener la cuenta" });
    }
  };

  // Actualizar cuenta
  static updateAccount = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      // Actualizar cuenta
      Object.assign(account, req.body);
      await account.save();

      res.json({
        msg: "Cuenta actualizada correctamente",
        account
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar la cuenta" });
    }
  };

  // Cambiar estado de cuenta
  static updateAccountStatus = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { status } = req.body;
      
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      account.status = status;
      await account.save();

      res.json({
        msg: "Estado de cuenta actualizado correctamente",
        account
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar el estado" });
    }
  };

  // Eliminar cuenta
  static deleteAccount = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      // Verificar si la cuenta tiene pagos asociados
      const hasPayments = await Payment.exists({ account: accountId });
      
      if (hasPayments) {
        return res.status(400).json({ 
          error: "No se puede eliminar una cuenta que tiene pagos asociados" 
        });
      }

      await Account.findByIdAndDelete(accountId);

      res.json({ msg: "Cuenta eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar la cuenta" });
    }
  };

  // Obtener historial de movimientos de una cuenta
  static getAccountMovements = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { page = 1, limit = 10, startDate, endDate } = req.query;
      
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      // Construir filtros
      const filter: any = { account: accountId };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const movements = await Payment.find(filter)
        .populate('createdBy', 'name email')
        .populate('invoice', 'invoiceNumber client provider')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Payment.countDocuments(filter);

      res.json({
        account,
        movements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los movimientos" });
    }
  };

  // Obtener balance total de todas las cuentas
  static getTotalBalance = async (req: Request, res: Response) => {
    try {
      const balanceByType = await Account.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$type',
            totalBalance: { $sum: '$balance' },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalBalance = await Account.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$balance' }
          }
        }
      ]);

      res.json({
        balanceByType,
        totalBalance: totalBalance[0]?.total || 0
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el balance total" });
    }
  };

  // Transferir dinero entre cuentas
  static transferBetweenAccounts = async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      
      // Las cuentas ya fueron validadas por el middleware
      const fromAccount = req.fromAccount!;
      const toAccount = req.toAccount!;

      // Crear pago de salida
      const expensePayment = new Payment({
        type: 'expense',
        amount,
        description: `Transferencia a ${toAccount.name} - ${description}`,
        method: 'transfer',
        account: fromAccount._id,
        status: 'completed',
        createdBy: req.user.id,
      });

      // Crear pago de entrada
      const incomePayment = new Payment({
        type: 'income',
        amount,
        description: `Transferencia desde ${fromAccount.name} - ${description}`,
        method: 'transfer',
        account: toAccount._id,
        status: 'completed',
        createdBy: req.user.id,
      });

      // Actualizar balances
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      // Guardar todo
      await Promise.all([
        expensePayment.save(),
        incomePayment.save(),
        fromAccount.save(),
        toAccount.save()
      ]);

      res.json({
        msg: "Transferencia realizada correctamente",
        transfer: {
          fromAccount: {
            id: fromAccount._id,
            name: fromAccount.name,
            newBalance: fromAccount.balance
          },
          toAccount: {
            id: toAccount._id,
            name: toAccount.name,
            newBalance: toAccount.balance
          },
          amount,
          description,
          expensePayment: expensePayment.paymentNumber,
          incomePayment: incomePayment.paymentNumber
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al realizar la transferencia" });
    }
  };
}

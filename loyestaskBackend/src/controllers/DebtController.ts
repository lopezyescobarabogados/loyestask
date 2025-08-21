import type { Request, Response } from "express";
import Debt from "../models/Debt";
import Client from "../models/Client";
import { validationResult } from "express-validator";

export class DebtController {
  
  // Obtener todas las deudas
  static getDebts = async (req: Request, res: Response) => {
    try {
      const { status, priority, client, overdue, search, page = 1, limit = 10 } = req.query;
      
      let filter: any = { createdBy: req.user!.id };
      
      if (status) {
        filter.status = status;
      }
      
      if (priority) {
        filter.priority = priority;
      }
      
      if (client) {
        filter.client = client;
      }
      
      if (overdue === 'true') {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $in: ['pending', 'partial'] };
      }
      
      if (search) {
        filter.$or = [
          { debtNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const [debts, total] = await Promise.all([
        Debt.find(filter)
          .populate('client', 'name email type')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),
        Debt.countDocuments(filter)
      ]);

      // Enriquecer deudas con información de interés mensual
      const debtsWithInterest = debts.map(debt => {
        const monthsOverdue = debt.getMonthsOverdue();
        const interestAmount = debt.calculateMonthlyInterest(monthsOverdue);
        const totalWithInterest = debt.getTotalAmountWithInterest();
        
        return {
          ...debt.toObject(),
          interestInfo: {
            monthsOverdue,
            monthlyInterestRate: debt.interestRate || 0,
            interestAmount,
            totalWithInterest,
            isOverdue: monthsOverdue > 0
          }
        };
      });

      const totalPages = Math.ceil(total / limitNumber);
      
      res.json({
        debts: debtsWithInterest,
        totalPages,
        currentPage: pageNumber,
        total
      });
    } catch (error) {
      console.error('Error obteniendo deudas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener una deuda por ID
  static getDebtById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      })
        .populate('client', 'name email type phone address')
        .populate('createdBy', 'name email');
      
      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }
      
      // Añadir información de interés mensual
      const monthsOverdue = debt.getMonthsOverdue();
      const interestAmount = debt.calculateMonthlyInterest(monthsOverdue);
      const totalWithInterest = debt.getTotalAmountWithInterest();
      
      const debtWithInterest = {
        ...debt.toObject(),
        interestInfo: {
          monthsOverdue,
          monthlyInterestRate: debt.interestRate || 0,
          interestAmount,
          totalWithInterest,
          isOverdue: monthsOverdue > 0
        }
      };
      
      res.json(debtWithInterest);
    } catch (error) {
      console.error('Error obteniendo deuda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Crear nueva deuda
  static createDebt = async (req: Request, res: Response) => {
    try {
      console.log('🔍 Datos recibidos en createDebt:', JSON.stringify(req.body, null, 2));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const {
        client,
        description,
        totalAmount,
        priority,
        dueDate,
        paymentTerms,
        interestRate,
        notes,
        emailNotifications
      } = req.body;

      // Verificar que el cliente existe y pertenece al usuario
      const clientDoc = await Client.findOne({
        _id: client,
        createdBy: req.user!.id
      });

      if (!clientDoc) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      console.log('✅ Cliente encontrado:', clientDoc.name);

      const debt = new Debt({
        client,
        description,
        totalAmount,
        remainingAmount: totalAmount, // Se calcula automáticamente en el middleware
        priority: priority || 'medium',
        dueDate: new Date(dueDate),
        issueDate: new Date(),
        paymentTerms: paymentTerms || clientDoc.paymentTerms || 30,
        interestRate: interestRate || 0,
        notes,
        emailNotifications: emailNotifications !== false, // Por defecto true
        createdBy: req.user!.id
      });

      await debt.save();
      
      // Actualizar la deuda total del cliente
      clientDoc.totalDebt = (clientDoc.totalDebt as number) + totalAmount;
      await clientDoc.save();

      await debt.populate('client', 'name email type');
      await debt.populate('createdBy', 'name email');

      res.status(201).json(debt);
    } catch (error) {
      console.error('Error creando deuda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Actualizar deuda
  static updateDebt = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { id } = req.params;
      const {
        description,
        totalAmount,
        priority,
        dueDate,
        paymentTerms,
        interestRate,
        notes,
        emailNotifications
      } = req.body;

      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }

      // Si se cambia el monto total, actualizar la deuda del cliente
      if (totalAmount && totalAmount !== debt.totalAmount) {
        const client = await Client.findById(debt.client);
        if (client) {
          const difference = totalAmount - (debt.totalAmount as number);
          client.totalDebt = (client.totalDebt as number) + difference;
          await client.save();
        }
      }

      // Actualizar campos
      debt.description = description || debt.description;
      debt.totalAmount = totalAmount || debt.totalAmount;
      debt.priority = priority || debt.priority;
      debt.dueDate = dueDate ? new Date(dueDate) : debt.dueDate;
      debt.paymentTerms = paymentTerms || debt.paymentTerms;
      debt.interestRate = interestRate !== undefined ? interestRate : debt.interestRate;
      debt.notes = notes || debt.notes;
      debt.emailNotifications = emailNotifications !== undefined ? emailNotifications : debt.emailNotifications;

      await debt.save();
      await debt.populate('client', 'name email type');
      await debt.populate('createdBy', 'name email');

      res.json(debt);
    } catch (error) {
      console.error('Error actualizando deuda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Eliminar deuda
  static deleteDebt = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }

      // Verificar si la deuda tiene pagos
      const DebtPayment = require('../models/DebtPayment').default;
      const paymentsCount = await DebtPayment.countDocuments({ debt: id });

      if (paymentsCount > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar la deuda porque tiene pagos registrados' 
        });
      }

      // Actualizar la deuda total del cliente
      const client = await Client.findById(debt.client);
      if (client) {
        client.totalDebt = (client.totalDebt as number) - (debt.totalAmount as number) + (debt.paidAmount as number);
        await client.save();
      }

      await debt.deleteOne();

      res.json({ message: 'Deuda eliminada correctamente' });
    } catch (error) {
      console.error('Error eliminando deuda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener deudas vencidas
  static getOverdueDebts = async (req: Request, res: Response) => {
    try {
      const overdueDebts = await Debt.find({
        createdBy: req.user!.id,
        dueDate: { $lt: new Date() },
        status: { $in: ['pending', 'partial'] }
      })
        .populate('client', 'name email phone')
        .populate('createdBy', 'name email')
        .sort({ dueDate: 1 });

      res.json(overdueDebts);
    } catch (error) {
      console.error('Error obteniendo deudas vencidas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener deudas próximas a vencer
  static getUpcomingDebts = async (req: Request, res: Response) => {
    try {
      const { days = 7 } = req.query;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(days));

      const upcomingDebts = await Debt.find({
        createdBy: req.user!.id,
        dueDate: { 
          $gte: new Date(),
          $lte: futureDate 
        },
        status: { $in: ['pending', 'partial'] }
      })
        .populate('client', 'name email phone')
        .populate('createdBy', 'name email')
        .sort({ dueDate: 1 });

      res.json(upcomingDebts);
    } catch (error) {
      console.error('Error obteniendo deudas próximas a vencer:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener estadísticas de deudas
  static getDebtStats = async (req: Request, res: Response) => {
    try {
      const totalDebts = await Debt.countDocuments({ createdBy: req.user!.id });
      
      const debtsByStatus = await Debt.aggregate([
        { $match: { createdBy: req.user!.id } },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$remainingAmount' } } }
      ]);

      const overdueCount = await Debt.countDocuments({
        createdBy: req.user!.id,
        dueDate: { $lt: new Date() },
        status: { $in: ['pending', 'partial'] }
      });

      const totalAmount = await Debt.aggregate([
        { $match: { createdBy: req.user!.id } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, remaining: { $sum: '$remainingAmount' }, paid: { $sum: '$paidAmount' } } }
      ]);

      const averageAmount = await Debt.aggregate([
        { $match: { createdBy: req.user!.id } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]);

      const stats = {
        totalDebts,
        overdueCount,
        debtsByStatus,
        totalAmount: totalAmount[0] || { total: 0, remaining: 0, paid: 0 },
        averageAmount: Math.round(averageAmount[0]?.avg || 0),
        collectionRate: totalAmount[0] ? 
          ((totalAmount[0].paid / totalAmount[0].total) * 100).toFixed(2) : 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas de deudas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Marcar deuda como pagada
  static markAsPaid = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }

      if (debt.status === 'paid') {
        return res.status(400).json({ error: 'La deuda ya está marcada como pagada' });
      }

      const remainingAmount = debt.remainingAmount as number;
      debt.paidAmount = debt.totalAmount;
      debt.status = 'paid';
      
      await debt.save();

      // Actualizar el cliente
      const client = await Client.findById(debt.client);
      if (client) {
        client.totalPaid = (client.totalPaid as number) + remainingAmount;
        client.totalDebt = (client.totalDebt as number) - remainingAmount;
        await client.save();
      }

      await debt.populate('client', 'name email type');
      await debt.populate('createdBy', 'name email');

      res.json(debt);
    } catch (error) {
      console.error('Error marcando deuda como pagada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Actualizar estado de una deuda
  static updateDebtStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'partial', 'paid', 'overdue', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }

      const oldStatus = debt.status;
      debt.status = status;
      
      // Si se marca como pagada
      if (status === 'paid' && oldStatus !== 'paid') {
        const remainingAmount = debt.remainingAmount as number;
        debt.paidAmount = debt.totalAmount;
        
        // Actualizar cliente
        const client = await Client.findById(debt.client);
        if (client) {
          client.totalPaid = (client.totalPaid as number) + remainingAmount;
          client.totalDebt = (client.totalDebt as number) - remainingAmount;
          await client.save();
        }
      }

      await debt.save();
      await debt.populate('client', 'name email type');
      await debt.populate('createdBy', 'name email');

      res.json(debt);
    } catch (error) {
      console.error('Error actualizando estado de deuda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Enviar notificación de deuda
  static sendDebtNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const debt = await Debt.findOne({
        _id: id,
        createdBy: req.user!.id
      }).populate('client', 'name email');

      if (!debt) {
        return res.status(404).json({ error: 'Deuda no encontrada' });
      }

      // Aquí se implementaría el envío del email
      // Por ahora solo simulamos la respuesta
      res.json({ 
        message: 'Notificación enviada exitosamente',
        debtId: debt._id,
        clientEmail: (debt.client as any).email
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

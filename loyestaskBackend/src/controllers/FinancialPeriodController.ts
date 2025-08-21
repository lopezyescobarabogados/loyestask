import type { Request, Response } from "express";
import FinancialPeriod from "../models/FinancialPeriod";
import Invoice from "../models/Invoice";
import Payment from "../models/Payment";

export class FinancialPeriodController {
  // Obtener todos los períodos financieros
  static getFinancialPeriods = async (req: Request, res: Response) => {
    try {
      const { year, status } = req.query;
      
      // Construir filtros
      const filter: any = {};
      if (year) filter.year = parseInt(year as string);
      if (status) filter.status = status;

      const periods = await FinancialPeriod.find(filter)
        .populate('closedBy', 'name email')
        .sort({ year: -1, month: -1 });

      res.json(periods);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los períodos financieros" });
    }
  };

  // Obtener período por ID
  static getFinancialPeriodById = async (req: Request, res: Response) => {
    try {
      const { periodId } = req.params;
      
      const period = await FinancialPeriod.findById(periodId)
        .populate('closedBy', 'name email');

      if (!period) {
        return res.status(404).json({ error: "Período financiero no encontrado" });
      }

      res.json(period);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el período financiero" });
    }
  };

  // Obtener o crear período actual
  static getCurrentPeriod = async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      let period = await FinancialPeriod.findOne({
        year: currentYear,
        month: currentMonth
      }).populate('closedBy', 'name email');

      // Si no existe, crear el período
      if (!period) {
        period = new FinancialPeriod({
          year: currentYear,
          month: currentMonth,
          status: 'open'
        });
        await period.save();
      }

      res.json(period);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el período actual" });
    }
  };

  // Cerrar período financiero (solo admin)
  static closePeriod = async (req: Request, res: Response) => {
    try {
      const { periodId } = req.params;
      
      const period = await FinancialPeriod.findById(periodId);
      
      if (!period) {
        return res.status(404).json({ error: "Período financiero no encontrado" });
      }

      if (period.status === 'closed') {
        return res.status(400).json({ error: "El período ya está cerrado" });
      }

      // Verificar que sea el período correcto (no futuro)
      const now = new Date();
      const periodDate = new Date(period.year, period.month - 1);
      const currentPeriod = new Date(now.getFullYear(), now.getMonth());

      if (periodDate > currentPeriod) {
        return res.status(400).json({ 
          error: "No se puede cerrar un período futuro" 
        });
      }

      // Cerrar período (el middleware calculará los totales)
      period.status = 'closed';
      period.closedBy = req.user.id;
      period.closedAt = new Date();
      
      await period.save();

      await period.populate('closedBy', 'name email');

      res.json({
        msg: "Período cerrado correctamente",
        period
      });
    } catch (error) {
      res.status(500).json({ error: "Error al cerrar el período" });
    }
  };

  // Reabrir período financiero (solo admin)
  static reopenPeriod = async (req: Request, res: Response) => {
    try {
      const { periodId } = req.params;
      
      const period = await FinancialPeriod.findById(periodId);
      
      if (!period) {
        return res.status(404).json({ error: "Período financiero no encontrado" });
      }

      if (period.status === 'open') {
        return res.status(400).json({ error: "El período ya está abierto" });
      }

      // Reabrir período
      period.status = 'open';
      period.closedBy = undefined;
      period.closedAt = undefined;
      
      // Resetear totales
      period.totalInvoices = 0;
      period.totalPayments = 0;
      period.totalIncome = 0;
      period.totalExpenses = 0;
      period.netIncome = 0;
      
      await period.save();

      // Desbloquear facturas y pagos del período
      const startDate = new Date(period.year, period.month - 1, 1);
      const endDate = new Date(period.year, period.month, 0, 23, 59, 59);

      await Promise.all([
        Invoice.updateMany(
          { createdAt: { $gte: startDate, $lte: endDate } },
          { isLocked: false }
        ),
        Payment.updateMany(
          { createdAt: { $gte: startDate, $lte: endDate } },
          { isLocked: false }
        )
      ]);

      res.json({
        msg: "Período reabierto correctamente",
        period
      });
    } catch (error) {
      res.status(500).json({ error: "Error al reabrir el período" });
    }
  };

  // Obtener resumen financiero de un período
  static getPeriodSummary = async (req: Request, res: Response) => {
    try {
      const { year, month } = req.params;
      
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Obtener resumen de facturas
      const invoiceSummary = await Invoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        }
      ]);

      // Obtener resumen de pagos
      const paymentSummary = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Calcular totales
      const totalIncome = paymentSummary.find(p => p._id === 'income')?.total || 0;
      const totalExpenses = paymentSummary.find(p => p._id === 'expense')?.total || 0;
      const netIncome = totalIncome - totalExpenses;

      // Verificar si existe el período
      const period = await FinancialPeriod.findOne({
        year: parseInt(year),
        month: parseInt(month)
      }).populate('closedBy', 'name email');

      res.json({
        period,
        summary: {
          invoices: invoiceSummary,
          payments: paymentSummary,
          totals: {
            income: totalIncome,
            expenses: totalExpenses,
            netIncome
          }
        },
        dateRange: {
          start: startDate,
          end: endDate
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el resumen del período" });
    }
  };

  // Obtener años disponibles
  static getAvailableYears = async (req: Request, res: Response) => {
    try {
      const years = await FinancialPeriod.distinct('year');
      const currentYear = new Date().getFullYear();
      
      // Incluir año actual si no está en la lista
      if (!years.includes(currentYear)) {
        years.push(currentYear);
      }
      
      years.sort((a, b) => b - a); // Orden descendente

      res.json(years);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los años disponibles" });
    }
  };
}

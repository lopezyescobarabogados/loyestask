import Invoice from "../models/Invoice";
import Payment from "../models/Payment";
import Account from "../models/Account";
import FinancialPeriod from "../models/FinancialPeriod";

export class FinancialService {
  // Obtener dashboard financiero
  static async getFinancialDashboard() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      // Resumen del año actual
      const [yearlyIncome, yearlyExpenses, totalInvoices, pendingInvoices, overdueInvoices, totalPayments, accountsBalance] = await Promise.all([
        // Ingresos del año
        Payment.aggregate([
          {
            $match: {
              type: 'income',
              status: 'completed',
              createdAt: { $gte: startOfYear, $lte: endOfYear }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Gastos del año
        Payment.aggregate([
          {
            $match: {
              type: 'expense',
              status: 'completed',
              createdAt: { $gte: startOfYear, $lte: endOfYear }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),

        // Total de facturas
        Invoice.countDocuments(),

        // Facturas pendientes
        Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] } }),

        // Facturas vencidas
        Invoice.countDocuments({ 
          status: { $in: ['sent', 'overdue'] },
          dueDate: { $lt: now }
        }),

        // Total de pagos realizados
        Payment.countDocuments({ status: 'completed' }),

        // Balance total de cuentas
        Account.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: null, total: { $sum: '$balance' } } }
        ])
      ]);

      // Ingresos mensuales para el año actual
      const monthlyIncomeData = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.month',
            income: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Crear array de todos los meses con datos
      const monthlyIncome = [];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let i = 1; i <= 12; i++) {
        const monthData = monthlyIncomeData.find(m => m._id === i);
        monthlyIncome.push({
          month: monthNames[i - 1],
          income: monthData?.income || 0,
          expenses: monthData?.expenses || 0
        });
      }

      // Top clientes (simulados por ahora)
      const topClients = [
        { name: 'Cliente A', amount: 50000, invoices: 5 },
        { name: 'Cliente B', amount: 35000, invoices: 3 },
        { name: 'Cliente C', amount: 25000, invoices: 2 }
      ];

      // Gastos por categoría (simulados por ahora) 
      const expensesByCategory = [
        { category: 'Oficina', amount: 15000, percentage: 45 },
        { category: 'Marketing', amount: 8000, percentage: 24 },
        { category: 'Tecnología', amount: 5000, percentage: 15 },
        { category: 'Otros', amount: 5000, percentage: 16 }
      ];

      return {
        totalIncome: yearlyIncome[0]?.total || 0,
        totalExpenses: yearlyExpenses[0]?.total || 0,
        netIncome: (yearlyIncome[0]?.total || 0) - (yearlyExpenses[0]?.total || 0),
        totalInvoices: totalInvoices || 0,
        pendingInvoices: pendingInvoices || 0,
        overdueInvoices: overdueInvoices || 0,
        totalPayments: totalPayments || 0,
        accountsBalance: accountsBalance[0]?.total || 0,
        monthlyIncome,
        topClients,
        expensesByCategory
      };
    } catch (error) {
      console.error('Error en getFinancialDashboard:', error);
      throw new Error('Error al obtener dashboard financiero');
    }
  }

  // Obtener flujo de caja
  static async getCashFlow(months: number = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const cashFlow = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: {
              year: '$_id.year',
              month: '$_id.month'
            },
            income: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
              }
            }
          }
        },
        {
          $addFields: {
            netFlow: { $subtract: ['$income', '$expenses'] }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return cashFlow;
    } catch (error) {
      throw new Error('Error al obtener flujo de caja');
    }
  }

  // Análisis de cuentas por cobrar
  static async getAccountsReceivable() {
    try {
      const now = new Date();
      
      const invoices = await Invoice.find({
        status: { $in: ['sent', 'overdue'] },
        type: 'sent'
      }).sort({ dueDate: 1 });

      // Clasificar por antigüedad
      const aging = {
        current: 0,      // No vencidas
        overdue30: 0,    // 1-30 días vencidas
        overdue60: 0,    // 31-60 días vencidas
        overdue90: 0,    // 61-90 días vencidas
        overdue90Plus: 0 // Más de 90 días vencidas
      };

      const agingDetails = {
        current: [],
        overdue30: [],
        overdue60: [],
        overdue90: [],
        overdue90Plus: []
      };

      invoices.forEach(invoice => {
        if (!invoice.dueDate || invoice.dueDate >= now) {
          aging.current += invoice.total;
          agingDetails.current.push(invoice);
        } else {
          const daysOverdue = Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysOverdue <= 30) {
            aging.overdue30 += invoice.total;
            agingDetails.overdue30.push(invoice);
          } else if (daysOverdue <= 60) {
            aging.overdue60 += invoice.total;
            agingDetails.overdue60.push(invoice);
          } else if (daysOverdue <= 90) {
            aging.overdue90 += invoice.total;
            agingDetails.overdue90.push(invoice);
          } else {
            aging.overdue90Plus += invoice.total;
            agingDetails.overdue90Plus.push(invoice);
          }
        }
      });

      return {
        summary: aging,
        details: agingDetails,
        totalPending: Object.values(aging).reduce((sum, value) => sum + value, 0)
      };
    } catch (error) {
      throw new Error('Error al obtener análisis de cuentas por cobrar');
    }
  }

  // Reporte de rentabilidad por cliente
  static async getClientProfitability() {
    try {
      const profitability = await Invoice.aggregate([
        {
          $match: {
            type: 'sent',
            status: { $in: ['paid', 'sent', 'overdue'] }
          }
        },
        {
          $group: {
            _id: '$client',
            totalInvoiced: { $sum: '$total' },
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0]
              }
            },
            invoiceCount: { $sum: 1 },
            lastInvoice: { $max: '$createdAt' }
          }
        },
        {
          $addFields: {
            pendingAmount: { $subtract: ['$totalInvoiced', '$totalPaid'] },
            paymentRate: {
              $cond: [
                { $gt: ['$totalInvoiced', 0] },
                { $multiply: [{ $divide: ['$totalPaid', '$totalInvoiced'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { totalInvoiced: -1 }
        }
      ]);

      return profitability;
    } catch (error) {
      throw new Error('Error al obtener rentabilidad por cliente');
    }
  }

  // Proyección de ingresos
  static async getIncomeProjection(months: number = 6) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Obtener promedio de ingresos de los últimos 6 meses
      const historicalIncome = await Payment.aggregate([
        {
          $match: {
            type: 'income',
            status: 'completed',
            createdAt: { $gte: sixMonthsAgo, $lte: now }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' }
          }
        }
      ]);

      const averageMonthlyIncome = historicalIncome.reduce((sum, month) => sum + month.total, 0) / Math.max(historicalIncome.length, 1);

      // Facturas pendientes confirmadas
      const confirmedIncome = await Invoice.aggregate([
        {
          $match: {
            type: 'sent',
            status: { $in: ['sent', 'overdue'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);

      // Generar proyección
      const projection = [];
      for (let i = 1; i <= months; i++) {
        const projectionDate = new Date();
        projectionDate.setMonth(projectionDate.getMonth() + i);
        
        projection.push({
          year: projectionDate.getFullYear(),
          month: projectionDate.getMonth() + 1,
          projectedIncome: averageMonthlyIncome,
          confirmedIncome: i === 1 ? (confirmedIncome[0]?.total || 0) : 0
        });
      }

      return {
        averageMonthlyIncome,
        projection,
        totalConfirmedIncome: confirmedIncome[0]?.total || 0
      };
    } catch (error) {
      throw new Error('Error al obtener proyección de ingresos');
    }
  }

  // Análisis de gastos por categoría
  static async getExpenseAnalysis() {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const expensesByCategory = await Payment.aggregate([
        {
          $match: {
            type: 'expense',
            status: 'completed',
            createdAt: { $gte: startOfYear, $lte: now }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            average: { $avg: '$amount' }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.total, 0);

      // Agregar porcentaje
      const expensesWithPercentage = expensesByCategory.map(category => ({
        ...category,
        percentage: totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0
      }));

      return {
        byCategory: expensesWithPercentage,
        totalExpenses,
        averageExpense: totalExpenses / Math.max(expensesByCategory.length, 1)
      };
    } catch (error) {
      throw new Error('Error al obtener análisis de gastos');
    }
  }
}

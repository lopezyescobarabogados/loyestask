import { MonthlyReportData } from './FinancialExportService';

export class MockFinancialService {
  /**
   * Genera datos de prueba para reportes financieros
   */
  static async generateMockMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentDate = new Date();
    const reportDate = new Date(year, month - 1, 1);

    // Solo generar datos para meses pasados
    if (reportDate > currentDate) {
      throw new Error('No se pueden generar reportes de períodos futuros');
    }

    // Datos simulados
    const totalIncome = Math.floor(Math.random() * 100000) + 50000;
    const totalExpenses = Math.floor(Math.random() * 50000) + 20000;
    const netIncome = totalIncome - totalExpenses;

    const mockInvoices = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      _id: `invoice_${year}_${month}_${i + 1}`,
      invoiceNumber: `INV-${year}-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
      client: `Cliente ${i + 1}`,
      amount: Math.floor(Math.random() * 15000) + 5000,
      issueDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
      dueDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
      status: ['draft', 'sent', 'paid', 'overdue'][Math.floor(Math.random() * 4)],
      description: `Servicios profesionales - ${monthNames[month - 1]} ${year}`,
      createdBy: {
        name: 'Admin Sistema',
        email: 'admin@loyestask.com'
      }
    }));

    const mockPayments = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
      _id: `payment_${year}_${month}_${i + 1}`,
      paymentNumber: `PAY-${year}-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
      amount: Math.floor(Math.random() * 12000) + 3000,
      paymentDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
      method: ['transfer', 'cash', 'check', 'credit_card'][Math.floor(Math.random() * 4)],
      description: `Pago recibido - ${monthNames[month - 1]} ${year}`,
      account: {
        name: 'Cuenta Principal',
        type: 'checking'
      },
      invoice: {
        invoiceNumber: mockInvoices[i % mockInvoices.length]?.invoiceNumber || 'N/A',
        client: mockInvoices[i % mockInvoices.length]?.client || 'Cliente General'
      },
      createdBy: {
        name: 'Admin Sistema',
        email: 'admin@loyestask.com'
      }
    }));

    const mockAccounts = [
      {
        _id: 'account_1',
        name: 'Cuenta Corriente Principal',
        type: 'checking',
        balance: Math.floor(Math.random() * 200000) + 100000,
        status: 'active',
        createdBy: {
          name: 'Admin Sistema',
          email: 'admin@loyestask.com'
        }
      },
      {
        _id: 'account_2',
        name: 'Cuenta de Ahorros',
        type: 'savings',
        balance: Math.floor(Math.random() * 150000) + 75000,
        status: 'active',
        createdBy: {
          name: 'Admin Sistema',
          email: 'admin@loyestask.com'
        }
      },
      {
        _id: 'account_3',
        name: 'Cuenta de Gastos',
        type: 'expense',
        balance: Math.floor(Math.random() * 50000) + 25000,
        status: 'active',
        createdBy: {
          name: 'Admin Sistema',
          email: 'admin@loyestask.com'
        }
      }
    ];

    const mockCashFlow = Array.from({ length: Math.floor(Math.random() * 15) + 10 }, (_, i) => {
      const isIncome = Math.random() > 0.4;
      return {
        date: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
        type: isIncome ? 'income' : 'expense',
        amount: isIncome ? Math.floor(Math.random() * 20000) + 5000 : Math.floor(Math.random() * 10000) + 2000,
        description: isIncome ? 'Ingreso por servicios' : 'Gasto operacional',
        category: isIncome ? 'services' : 'operations'
      };
    });

    return {
      year,
      month,
      period: {
        totalIncome,
        totalExpenses,
        netIncome,
        status: netIncome > 0 ? 'profitable' : 'loss'
      },
      summary: {
        totalInvoices: mockInvoices.length,
        paidInvoices: mockInvoices.filter(inv => inv.status === 'paid').length,
        pendingInvoices: mockInvoices.filter(inv => inv.status === 'sent').length,
        overdueInvoices: mockInvoices.filter(inv => inv.status === 'overdue').length,
        totalAccounts: mockAccounts.length,
        totalBalance: mockAccounts.reduce((sum, acc) => sum + acc.balance, 0)
      },
      invoices: mockInvoices,
      payments: mockPayments,
      accounts: mockAccounts,
      cashFlow: mockCashFlow
    };
  }

  /**
   * Genera lista de reportes disponibles simulados
   */
  static async generateMockAvailableReports(year?: number): Promise<any[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const targetYear = year || currentYear;
    const reports = [];

    // Generar reportes para todos los meses hasta el mes actual (si es el año actual)
    const maxMonth = targetYear === currentYear ? currentMonth - 1 : 12;

    for (let month = 1; month <= maxMonth; month++) {
      const monthData = await this.generateMockMonthlyReport(targetYear, month);
      reports.push({
        year: targetYear,
        month,
        monthName: [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ][month - 1],
        totalIncome: monthData.period.totalIncome,
        totalExpenses: monthData.period.totalExpenses,
        netIncome: monthData.period.netIncome,
        invoiceCount: monthData.summary.totalInvoices,
        paymentCount: monthData.payments.length,
        status: monthData.period.status,
        generatedAt: new Date().toISOString()
      });
    }

    return reports;
  }
}

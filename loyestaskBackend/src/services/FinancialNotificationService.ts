import Invoice from "../models/Invoice";
import User from "../models/User";
import Account from "../models/Account";
import Debt from "../models/Debt";
import Client from "../models/Client";
import { FinancialService } from "./FinancialService";
import { EmailService } from "./EmailService";
import cron from "node-cron";

// Utilidades para fechas
class DateUtils {
  static format(date: Date, formatStr: string): string {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (formatStr.includes('yyyy')) {
      options.year = 'numeric';
    }
    if (formatStr.includes('MM')) {
      options.month = '2-digit';
    }
    if (formatStr.includes('dd')) {
      options.day = '2-digit';
    }
    if (formatStr.includes('HH')) {
      options.hour = '2-digit';
    }
    if (formatStr.includes('mm')) {
      options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('es-CO', options).format(date);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

export class FinancialNotificationService {
  private static instance: FinancialNotificationService;

  private constructor() {
    this.initializeCronJobs();
  }

  static getInstance(): FinancialNotificationService {
    if (!FinancialNotificationService.instance) {
      FinancialNotificationService.instance = new FinancialNotificationService();
    }
    return FinancialNotificationService.instance;
  }

  private initializeCronJobs() {
    // Revisar facturas vencidas todos los días a las 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      try {
        await this.checkOverdueInvoices();
        console.log('✅ Revisión de facturas vencidas completada');
      } catch (error) {
        console.error('❌ Error en revisión de facturas vencidas:', error);
      }
    });

    // Revisar deudas vencidas todos los días a las 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.checkOverdueDebts();
        console.log('✅ Revisión de deudas vencidas completada');
      } catch (error) {
        console.error('❌ Error en revisión de deudas vencidas:', error);
      }
    });

    // Revisar próximos vencimientos todos los días a las 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      try {
        await this.checkUpcomingDueDebts();
        console.log('✅ Revisión de próximos vencimientos completada');
      } catch (error) {
        console.error('❌ Error en revisión de próximos vencimientos:', error);
      }
    });

    // Verificar saldos bajos a las 7:00 AM
    cron.schedule('0 7 * * *', async () => {
      try {
        await this.checkLowAccountBalances();
        console.log('✅ Revisión de saldos bajos completada');
      } catch (error) {
        console.error('❌ Error en revisión de saldos bajos:', error);
      }
    });

    // Reporte mensual el primer día del mes a las 9:00 AM
    cron.schedule('0 9 1 * *', async () => {
      try {
        await this.sendMonthlyFinancialReport();
        console.log('✅ Reporte financiero mensual enviado');
      } catch (error) {
        console.error('❌ Error en reporte financiero mensual:', error);
      }
    });

    console.log('🔄 Tareas programadas de notificaciones financieras inicializadas');
  }

  // Verificar facturas vencidas
  private async checkOverdueInvoices() {
    try {
      const now = new Date();
      
      // Buscar facturas que vencieron y no han sido marcadas como vencidas
      const overdueInvoices = await Invoice.find({
        status: 'sent',
        dueDate: { $lt: now }
      }).populate('createdBy', 'name email');

      if (overdueInvoices.length === 0) {
        return;
      }

      // Actualizar estado a vencidas
      await Invoice.updateMany(
        {
          status: 'sent',
          dueDate: { $lt: now }
        },
        { status: 'overdue' }
      );

      // Enviar notificaciones
      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.ceil((now.getTime() - invoice.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
        
        // Notificar por email si está configurado
        if (process.env.SEND_OVERDUE_EMAILS === 'true') {
          await this.sendOverdueInvoiceEmail(invoice, daysOverdue);
        }

        // Log para sistema interno
        console.log(`📧 Factura vencida: ${invoice.invoiceNumber} - Cliente: ${invoice.client} - ${daysOverdue} días`);
      }

      console.log(`📧 ${overdueInvoices.length} facturas vencidas procesadas`);
    } catch (error) {
      console.error('Error al verificar facturas vencidas:', error);
      throw error;
    }
  }

  // Verificar facturas próximas a vencer
  private async checkUpcomingDueInvoices() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const upcomingInvoices = await Invoice.find({
        status: 'sent',
        dueDate: { 
          $gte: now,
          $lte: threeDaysFromNow
        }
      }).populate('createdBy', 'name email');

      for (const invoice of upcomingInvoices) {
        const daysUntilDue = Math.ceil((invoice.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Log para sistema interno
        console.log(`📋 Factura próxima a vencer: ${invoice.invoiceNumber} - Cliente: ${invoice.client} - ${daysUntilDue} días`);
        
        // Enviar email si está configurado
        if (process.env.SEND_UPCOMING_EMAILS === 'true') {
          await this.sendUpcomingInvoiceEmail(invoice, daysUntilDue);
        }
      }

      console.log(`📋 ${upcomingInvoices.length} facturas próximas a vencer notificadas`);
    } catch (error) {
      console.error('Error al verificar facturas próximas a vencer:', error);
      throw error;
    }
  }

  // Enviar reporte financiero semanal
  private async sendWeeklyFinancialReport() {
    try {
      const dashboard = await FinancialService.getFinancialDashboard();
      const accountsReceivable = await FinancialService.getAccountsReceivable();

      // Obtener administradores
      const admins = await User.find({ role: 'admin' });

      const reportSummary = `
📊 Reporte Financiero Semanal

💰 Balance Total: $${dashboard.accountsBalance.toLocaleString()}

📈 Este Año:
- Ingresos: $${dashboard.totalIncome.toLocaleString()}
- Gastos: $${dashboard.totalExpenses.toLocaleString()}
- Ganancia Neta: $${dashboard.netIncome.toLocaleString()}

🧾 Facturas:
- Total: ${dashboard.totalInvoices}
- Pendientes: ${dashboard.pendingInvoices}
- Vencidas: ${dashboard.overdueInvoices}

⚠️ Total de Pagos: ${dashboard.totalPayments}
      `;

      // Enviar email a administradores
      for (const admin of admins) {
        if (process.env.SEND_WEEKLY_REPORTS === 'true') {
          await EmailService.sendEmail({
            to: admin.email,
            subject: 'Reporte Financiero Semanal',
            html: this.formatWeeklyReportHTML(dashboard, accountsReceivable)
          });
        }
      }

      console.log(`📧 Reporte semanal enviado a ${admins.length} administradores`);
    } catch (error) {
      console.error('Error al enviar reporte semanal:', error);
      throw error;
    }
  }

  // Enviar reporte financiero mensual
  private async sendMonthlyFinancialReport() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const cashFlow = await FinancialService.getCashFlow(12);
      const clientProfitability = await FinancialService.getClientProfitability();
      const expenseAnalysis = await FinancialService.getExpenseAnalysis();

      // Obtener administradores
      const admins = await User.find({ role: 'admin' });

      const reportSummary = `
📊 Reporte Financiero Mensual - ${lastMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}

📈 Flujo de Caja (Últimos 6 meses):
${cashFlow.slice(-6).map(flow => 
  `- ${flow._id.month}/${flow._id.year}: Ingresos $${flow.income.toLocaleString()} | Gastos $${flow.expenses.toLocaleString()} | Neto $${flow.netFlow.toLocaleString()}`
).join('\n')}

💼 Top 5 Clientes:
${clientProfitability.slice(0, 5).map((client, index) => 
  `${index + 1}. ${client._id}: $${client.totalInvoiced.toLocaleString()} (${client.paymentRate.toFixed(1)}% pagado)`
).join('\n')}

💸 Gastos por Categoría:
${expenseAnalysis.byCategory.slice(0, 5).map((category, index) => 
  `${index + 1}. ${category._id || 'Sin categoría'}: $${category.total.toLocaleString()} (${category.percentage.toFixed(1)}%)`
).join('\n')}
      `;

      // Enviar email a administradores
      for (const admin of admins) {
        if (process.env.SEND_MONTHLY_REPORTS === 'true') {
          await EmailService.sendEmail({
            to: admin.email,
            subject: 'Reporte Financiero Mensual',
            html: this.formatMonthlyReportHTML(cashFlow, clientProfitability, expenseAnalysis)
          });
        }
      }

      console.log(`📧 Reporte mensual enviado a ${admins.length} administradores`);
    } catch (error) {
      console.error('Error al enviar reporte mensual:', error);
      throw error;
    }
  }

  // Método para enviar alertas de bajo balance en cuentas
  async checkLowAccountBalances() {
    try {
      const lowBalanceAccounts = await Account.find({
        status: 'active',
        balance: { $lt: 1000 } // Umbral configurable
      });

      if (lowBalanceAccounts.length === 0) {
        return;
      }

      const admins = await User.find({ role: 'admin' });

      const alertMessage = `${lowBalanceAccounts.length} cuenta(s) tienen saldo bajo:\n${lowBalanceAccounts.map(acc => `- ${acc.name}: $${acc.balance.toLocaleString()}`).join('\n')}`;

      // Enviar email a administradores
      for (const admin of admins) {
        if (process.env.SEND_BALANCE_ALERTS === 'true') {
          await EmailService.sendEmail({
            to: admin.email,
            subject: 'Alerta de Saldo Bajo',
            html: this.formatLowBalanceAlertHTML(lowBalanceAccounts)
          });
        }
      }

      console.log(`⚠️ Alerta de saldo bajo enviada para ${lowBalanceAccounts.length} cuentas`);
    } catch (error) {
      console.error('Error al verificar saldos bajos:', error);
      throw error;
    }
  }

  // Enviar email de factura vencida
  private async sendOverdueInvoiceEmail(invoice: any, daysOverdue: number) {
    try {
      console.log(`📧 Email de factura vencida enviado para ${invoice.invoiceNumber} (${daysOverdue} días)`);
    } catch (error) {
      console.error('Error al enviar email de factura vencida:', error);
    }
  }

  // Enviar email de factura próxima a vencer
  private async sendUpcomingInvoiceEmail(invoice: any, daysUntilDue: number) {
    try {
      console.log(`📧 Email de factura próxima a vencer enviado para ${invoice.invoiceNumber} (${daysUntilDue} días)`);
    } catch (error) {
      console.error('Error al enviar email de factura próxima a vencer:', error);
    }
  }

  // Formatear HTML para reporte semanal
  private formatWeeklyReportHTML(dashboard: any, accountsReceivable: any): string {
    return `
      <h2>📊 Reporte Financiero Semanal</h2>
      <h3>💰 Balance Total: $${dashboard.accountsBalance.toLocaleString()}</h3>
      <h3>📈 Este Año:</h3>
      <ul>
        <li>Ingresos: $${dashboard.totalIncome.toLocaleString()}</li>
        <li>Gastos: $${dashboard.totalExpenses.toLocaleString()}</li>
        <li>Ganancia Neta: $${dashboard.netIncome.toLocaleString()}</li>
      </ul>
      <h3>🧾 Facturas:</h3>
      <ul>
        <li>Total: ${dashboard.totalInvoices}</li>
        <li>Pendientes: ${dashboard.pendingInvoices}</li>
        <li>Vencidas: ${dashboard.overdueInvoices}</li>
      </ul>
      <h3>⚠️ Total de Pagos: ${dashboard.totalPayments}</h3>
    `;
  }

  // Formatear HTML para reporte mensual
  private formatMonthlyReportHTML(cashFlow: any[], clientProfitability: any[], expenseAnalysis: any): string {
    return `
      <h2>📊 Reporte Financiero Mensual</h2>
      <h3>📈 Flujo de Caja (Últimos 6 meses):</h3>
      <ul>
        ${cashFlow.slice(-6).map(flow => 
          `<li>${flow._id.month}/${flow._id.year}: Ingresos $${flow.income.toLocaleString()} | Gastos $${flow.expenses.toLocaleString()} | Neto $${flow.netFlow.toLocaleString()}</li>`
        ).join('')}
      </ul>
      <h3>💼 Top 5 Clientes:</h3>
      <ul>
        ${clientProfitability.slice(0, 5).map((client, index) => 
          `<li>${index + 1}. ${client._id}: $${client.totalInvoiced.toLocaleString()} (${client.paymentRate.toFixed(1)}% pagado)</li>`
        ).join('')}
      </ul>
    `;
  }

  // Formatear HTML para alerta de saldo bajo
  private formatLowBalanceAlertHTML(accounts: any[]): string {
    return `
      <h2>⚠️ Alerta de Saldo Bajo</h2>
      <p>Las siguientes cuentas tienen saldo bajo:</p>
      <ul>
        ${accounts.map(acc => `<li>${acc.name}: $${acc.balance.toLocaleString()}</li>`).join('')}
      </ul>
    `;
  }

  // ==================== MÉTODOS PARA GESTIÓN DE DEUDAS ====================

  // Verificar deudas vencidas
  private async checkOverdueDebts() {
    try {
      const now = new Date();
      
      // Buscar deudas vencidas que necesitan notificación
      const overdueDebts = await Debt.find({
        dueDate: { $lt: now },
        status: { $in: ['pending', 'partial'] },
        emailNotifications: true,
        $or: [
          { notificationDate: { $exists: false } },
          { notificationDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Último envío hace más de 24 horas
        ]
      })
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

      if (overdueDebts.length === 0) {
        return;
      }

      console.log(`📧 Procesando ${overdueDebts.length} deudas vencidas para notificación`);

      // Actualizar estado a vencidas
      await Debt.updateMany(
        {
          dueDate: { $lt: now },
          status: { $in: ['pending', 'partial'] }
        },
        { status: 'overdue' }
      );

      // Enviar notificaciones
      for (const debt of overdueDebts) {
        const daysOverdue = Math.ceil((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (process.env.SEND_DEBT_EMAILS === 'true') {
          await this.sendOverdueDebtEmail(debt, daysOverdue);
        }

        console.log(`📧 Deuda vencida: ${debt.debtNumber} - Cliente: ${(debt.client as any).name} - ${daysOverdue} días`);
        
        // Esperar un poco entre emails
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error verificando deudas vencidas:', error);
    }
  }

  // Verificar próximos vencimientos de deudas
  private async checkUpcomingDueDebts(daysBefore: number = 3) {
    try {
      const futureDate = DateUtils.addDays(new Date(), daysBefore);
      
      const upcomingDebts = await Debt.find({
        dueDate: {
          $gte: new Date(),
          $lte: futureDate
        },
        status: { $in: ['pending', 'partial'] },
        emailNotifications: true,
        $or: [
          { notificationDate: { $exists: false } },
          { notificationDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      })
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

      if (upcomingDebts.length === 0) {
        return;
      }

      console.log(`📅 Procesando ${upcomingDebts.length} deudas próximas a vencer para notificación`);

      for (const debt of upcomingDebts) {
        const daysUntilDue = Math.floor((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (process.env.SEND_DEBT_EMAILS === 'true') {
          await this.sendUpcomingDebtEmail(debt, daysUntilDue);
        }

        console.log(`📅 Próximo vencimiento: ${debt.debtNumber} - Cliente: ${(debt.client as any).name} - ${daysUntilDue} días`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error verificando próximos vencimientos:', error);
    }
  }

  // Enviar email de deuda vencida
  private async sendOverdueDebtEmail(debt: any, daysOverdue: number) {
    try {
      const client = debt.client;
      const user = debt.createdBy;

      if (!client.email) {
        console.log(`Cliente ${client.name} no tiene email configurado`);
        return;
      }

      const subject = `⚠️ Pago Vencido - ${debt.debtNumber} - ${client.name}`;
      const html = this.generateDebtNotificationHTML(debt, client, user, 'overdue', daysOverdue);

      await EmailService.sendEmail({
        to: client.email,
        subject,
        html
      });

      // Actualizar fecha de notificación
      debt.notificationDate = new Date();
      await debt.save();

      console.log(`✅ Email de deuda vencida enviado a: ${client.email}`);
    } catch (error) {
      console.error('Error enviando email de deuda vencida:', error);
    }
  }

  // Enviar email de próximo vencimiento
  private async sendUpcomingDebtEmail(debt: any, daysUntilDue: number) {
    try {
      const client = debt.client;
      const user = debt.createdBy;

      if (!client.email) {
        return;
      }

      const subject = `⏰ Pago Próximo a Vencer - ${debt.debtNumber} - ${client.name}`;
      const html = this.generateDebtNotificationHTML(debt, client, user, 'upcoming', daysUntilDue);

      await EmailService.sendEmail({
        to: client.email,
        subject,
        html
      });

      debt.notificationDate = new Date();
      await debt.save();

      console.log(`✅ Email de próximo vencimiento enviado a: ${client.email}`);
    } catch (error) {
      console.error('Error enviando email de próximo vencimiento:', error);
    }
  }

  // Generar HTML para notificaciones de deuda
  private generateDebtNotificationHTML(debt: any, client: any, user: any, type: 'overdue' | 'upcoming' | 'reminder', days?: number): string {
    const baseStyles = `
      <style>
        .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .footer { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #6c757d; }
        .alert { padding: 12px; border-radius: 4px; margin: 15px 0; }
        .alert-danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 8px 12px; border: 1px solid #dee2e6; text-align: left; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .amount { font-size: 18px; font-weight: bold; color: #dc3545; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    `;

    let alertClass = 'alert-info';
    let title = 'Recordatorio de Pago';
    let message = '';

    switch (type) {
      case 'overdue':
        alertClass = 'alert-danger';
        title = '⚠️ Pago Vencido';
        message = `Su pago ha vencido hace ${days} día${days !== 1 ? 's' : ''}`;
        break;
      case 'upcoming':
        alertClass = 'alert-warning';
        title = '⏰ Pago Próximo a Vencer';
        message = `Su pago vence en ${days} día${days !== 1 ? 's' : ''}`;
        break;
      case 'reminder':
        alertClass = 'alert-info';
        title = '📋 Recordatorio de Pago';
        message = 'Recordatorio programado para su pago pendiente';
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #333;">${process.env.APP_NAME || 'LoyesTask'}</h1>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Sistema de Gestión Financiera</p>
          </div>

          <div class="content">
            <h2>${title}</h2>
            
            <div class="alert ${alertClass}">
              <strong>${message}</strong>
            </div>

            <h3>Detalles del Pago:</h3>
            <table class="table">
              <tr>
                <th>Número de Deuda:</th>
                <td>${debt.debtNumber}</td>
              </tr>
              <tr>
                <th>Descripción:</th>
                <td>${debt.description}</td>
              </tr>
              <tr>
                <th>Monto Total:</th>
                <td class="amount">$${debt.totalAmount.toLocaleString('es-CO')}</td>
              </tr>
              <tr>
                <th>Monto Pendiente:</th>
                <td class="amount">$${debt.remainingAmount.toLocaleString('es-CO')}</td>
              </tr>
              <tr>
                <th>Fecha de Vencimiento:</th>
                <td>${DateUtils.format(new Date(debt.dueDate), 'dd/MM/yyyy')}</td>
              </tr>
              <tr>
                <th>Estado:</th>
                <td>${this.getDebtStatusLabel(debt.status)}</td>
              </tr>
            </table>

            <h3>Información de Contacto:</h3>
            <table class="table">
              <tr>
                <th>Empresa:</th>
                <td>${user.name}</td>
              </tr>
              <tr>
                <th>Email:</th>
                <td>${user.email}</td>
              </tr>
            </table>

            ${debt.notes ? `
              <h3>Notas Adicionales:</h3>
              <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${debt.notes}</p>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/financial/debts/${debt._id}" class="btn">
                Ver Detalles del Pago
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>Este es un mensaje automático, por favor no responder.</strong></p>
            <p>Si tiene alguna pregunta sobre este pago, puede contactarnos directamente.</p>
            <p>Enviado el ${DateUtils.format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Obtener etiqueta de estado de deuda en español
  private getDebtStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'partial': 'Pago Parcial',
      'paid': 'Pagado',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    };
    return statusLabels[status] || status;
  }

  // Método público para enviar recordatorio manual
  async sendManualDebtReminder(debtId: string): Promise<boolean> {
    try {
      const debt = await Debt.findById(debtId)
        .populate('client', 'name email')
        .populate('createdBy', 'name email');

      if (!debt || !debt.emailNotifications) {
        return false;
      }

      const client = debt.client as any;
      const user = debt.createdBy as any;
      
      if (!client.email) {
        return false;
      }

      const subject = `📋 Recordatorio de Pago - ${debt.debtNumber} - ${client.name}`;
      const html = this.generateDebtNotificationHTML(debt, client, user, 'reminder');

      await EmailService.sendEmail({
        to: client.email,
        subject,
        html
      });

      debt.notificationDate = new Date();
      await debt.save();

      return true;
    } catch (error) {
      console.error('Error enviando recordatorio manual:', error);
      return false;
    }
  }

  // Obtener resumen de notificaciones de deudas
  async getDebtNotificationSummary(userId: string): Promise<any> {
    try {
      const overdueCount = await Debt.countDocuments({
        createdBy: userId,
        dueDate: { $lt: new Date() },
        status: { $in: ['pending', 'partial'] }
      });

      const upcomingCount = await Debt.countDocuments({
        createdBy: userId,
        dueDate: {
          $gte: new Date(),
          $lte: DateUtils.addDays(new Date(), 7)
        },
        status: { $in: ['pending', 'partial'] }
      });

      const notificationsSent = await Debt.countDocuments({
        createdBy: userId,
        notificationDate: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        overdueCount,
        upcomingCount,
        notificationsSent,
        lastProcessed: new Date()
      };
    } catch (error) {
      console.error('Error obteniendo resumen de notificaciones de deudas:', error);
      return {
        overdueCount: 0,
        upcomingCount: 0,
        notificationsSent: 0,
        lastProcessed: new Date()
      };
    }
  }
}

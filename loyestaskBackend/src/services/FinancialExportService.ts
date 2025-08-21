import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Account from '../models/Account';
import FinancialPeriod from '../models/FinancialPeriod';
import { FinancialService } from './FinancialService';

export interface MonthlyReportData {
  year: number;
  month: number;
  period: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    status: string;
  };
  summary: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalAccounts: number;
    totalBalance: number;
  };
  invoices: any[];
  payments: any[];
  accounts: any[];
  cashFlow: any[];
}

export class FinancialExportService {
  /**
   * Genera un reporte financiero mensual completo
   */
  static async generateMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
    try {
      // Validar parámetros
      if (!year || !month || month < 1 || month > 12) {
        throw new Error('Año y mes válidos son requeridos');
      }

      // Fechas del período
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Obtener datos del período financiero
      const period = await FinancialPeriod.findOne({ year, month }).lean();

      // Resumen de facturas del mes
      const [
        invoicesData,
        paymentsData,
        accountsData,
        invoicesSummary,
        cashFlowData
      ] = await Promise.all([
        // Facturas del mes
        Invoice.find({
          $or: [
            { issueDate: { $gte: startDate, $lte: endDate } },
            { dueDate: { $gte: startDate, $lte: endDate } }
          ]
        })
        .populate('createdBy', 'name email')
        .sort({ issueDate: -1 })
        .lean(),

        // Pagos del mes
        Payment.find({
          paymentDate: { $gte: startDate, $lte: endDate }
        })
        .populate('account', 'name type')
        .populate('invoice', 'invoiceNumber client')
        .populate('createdBy', 'name email')
        .sort({ paymentDate: -1 })
        .lean(),

        // Estado de cuentas al final del mes
        Account.find({ status: { $ne: 'closed' } })
        .populate('createdBy', 'name email')
        .sort({ name: 1 })
        .lean(),

        // Resumen de facturas
        Invoice.aggregate([
          {
            $facet: {
              total: [
                { $match: { issueDate: { $gte: startDate, $lte: endDate } } },
                { $count: "count" }
              ],
              paid: [
                { 
                  $match: { 
                    issueDate: { $gte: startDate, $lte: endDate },
                    status: 'paid'
                  } 
                },
                { $count: "count" }
              ],
              pending: [
                { 
                  $match: { 
                    issueDate: { $gte: startDate, $lte: endDate },
                    status: { $in: ['sent', 'draft'] }
                  } 
                },
                { $count: "count" }
              ],
              overdue: [
                { 
                  $match: { 
                    issueDate: { $gte: startDate, $lte: endDate },
                    status: 'overdue'
                  } 
                },
                { $count: "count" }
              ]
            }
          }
        ]),

        // Flujo de caja del mes
        FinancialService.getCashFlow(1)
      ]);

      // Calcular totales de las cuentas
      const totalBalance = accountsData.reduce((sum, account) => sum + account.balance, 0);

      return {
        year,
        month,
        period: period || {
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          status: 'open'
        },
        summary: {
          totalInvoices: invoicesSummary[0]?.total[0]?.count || 0,
          paidInvoices: invoicesSummary[0]?.paid[0]?.count || 0,
          pendingInvoices: invoicesSummary[0]?.pending[0]?.count || 0,
          overdueInvoices: invoicesSummary[0]?.overdue[0]?.count || 0,
          totalAccounts: accountsData.length,
          totalBalance
        },
        invoices: invoicesData,
        payments: paymentsData,
        accounts: accountsData,
        cashFlow: cashFlowData
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw new Error('Error al generar el reporte mensual');
    }
  }

  /**
   * Exporta reporte mensual a Excel
   */
  static async exportToExcel(year: number, month: number): Promise<Buffer> {
    try {
      const reportData = await this.generateMonthlyReport(year, month);
      const workbook = new ExcelJS.Workbook();

      // Configuración del workbook
      workbook.creator = 'LoyesTask';
      workbook.lastModifiedBy = 'LoyesTask';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Hoja 1: Resumen Ejecutivo
      const summarySheet = workbook.addWorksheet('Resumen Ejecutivo');
      this.createSummarySheet(summarySheet, reportData);

      // Hoja 2: Facturas
      const invoicesSheet = workbook.addWorksheet('Facturas');
      this.createInvoicesSheet(invoicesSheet, reportData.invoices);

      // Hoja 3: Pagos
      const paymentsSheet = workbook.addWorksheet('Pagos');
      this.createPaymentsSheet(paymentsSheet, reportData.payments);

      // Hoja 4: Cuentas
      const accountsSheet = workbook.addWorksheet('Cuentas');
      this.createAccountsSheet(accountsSheet, reportData.accounts);

      // Hoja 5: Flujo de Caja
      const cashFlowSheet = workbook.addWorksheet('Flujo de Caja');
      this.createCashFlowSheet(cashFlowSheet, reportData.cashFlow);

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Error al exportar a Excel');
    }
  }

  /**
   * Exporta reporte mensual a PDF
   */
  static async exportToPDF(year: number, month: number): Promise<Buffer> {
    try {
      const reportData = await this.generateMonthlyReport(year, month);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Generar HTML del reporte
      const htmlContent = this.generateReportHTML(reportData);
      
      // Configurar el contenido HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span style="margin-left: 10px;">Reporte Financiero - ${this.getMonthName(month)} ${year}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
            <span style="margin-left: 20px;">Generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        `
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Error al exportar a PDF');
    }
  }

  /**
   * Crea la hoja de resumen ejecutivo
   */
  private static createSummarySheet(sheet: ExcelJS.Worksheet, data: MonthlyReportData) {
    // Título
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REPORTE FINANCIERO - ${this.getMonthName(data.month).toUpperCase()} ${data.year}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Información del período
    sheet.getCell('A3').value = 'INFORMACIÓN DEL PERÍODO';
    sheet.getCell('A3').font = { bold: true, size: 12 };
    
    sheet.getCell('A4').value = 'Estado del Período:';
    sheet.getCell('B4').value = data.period.status === 'closed' ? 'CERRADO' : 'ABIERTO';
    sheet.getCell('B4').font = { bold: true, color: { argb: data.period.status === 'closed' ? 'FFFF0000' : 'FF008000' } };

    // Resumen financiero
    sheet.getCell('A6').value = 'RESUMEN FINANCIERO';
    sheet.getCell('A6').font = { bold: true, size: 12 };

    const financialData = [
      ['Total Ingresos:', data.period.totalIncome, 'USD'],
      ['Total Gastos:', data.period.totalExpenses, 'USD'],
      ['Ingreso Neto:', data.period.netIncome, 'USD'],
      ['Balance Total Cuentas:', data.summary.totalBalance, 'USD']
    ];

    financialData.forEach((row, index) => {
      const rowNum = 7 + index;
      sheet.getCell(`A${rowNum}`).value = row[0];
      sheet.getCell(`B${rowNum}`).value = row[1];
      sheet.getCell(`C${rowNum}`).value = row[2];
      
      // Formato de moneda
      sheet.getCell(`B${rowNum}`).numFmt = '#,##0.00';
      if (typeof row[0] === 'string' && row[0].includes('Neto') && typeof row[1] === 'number' && row[1] < 0) {
        sheet.getCell(`B${rowNum}`).font = { color: { argb: 'FFFF0000' } };
      }
    });

    // Resumen de facturas
    sheet.getCell('A12').value = 'RESUMEN DE FACTURAS';
    sheet.getCell('A12').font = { bold: true, size: 12 };

    const invoiceData = [
      ['Total Facturas:', data.summary.totalInvoices],
      ['Facturas Pagadas:', data.summary.paidInvoices],
      ['Facturas Pendientes:', data.summary.pendingInvoices],
      ['Facturas Vencidas:', data.summary.overdueInvoices]
    ];

    invoiceData.forEach((row, index) => {
      const rowNum = 13 + index;
      sheet.getCell(`A${rowNum}`).value = row[0];
      sheet.getCell(`B${rowNum}`).value = row[1];
      if (typeof row[0] === 'string' && row[0].includes('Vencidas') && typeof row[1] === 'number' && row[1] > 0) {
        sheet.getCell(`B${rowNum}`).font = { color: { argb: 'FFFF0000' } };
      }
    });

    // Ajustar anchos de columna
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 15;
    sheet.getColumn('C').width = 10;
  }

  /**
   * Crea la hoja de facturas
   */
  private static createInvoicesSheet(sheet: ExcelJS.Worksheet, invoices: any[]) {
    // Encabezados
    const headers = ['Número', 'Tipo', 'Cliente/Proveedor', 'Estado', 'Fecha Emisión', 'Fecha Vencimiento', 'Total', 'Moneda'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Datos
    invoices.forEach((invoice, index) => {
      const rowNum = index + 2;
      sheet.getCell(rowNum, 1).value = invoice.invoiceNumber;
      sheet.getCell(rowNum, 2).value = invoice.type === 'sent' ? 'Enviada' : 'Recibida';
      sheet.getCell(rowNum, 3).value = invoice.client || invoice.provider || 'N/A';
      sheet.getCell(rowNum, 4).value = this.translateStatus(invoice.status);
      sheet.getCell(rowNum, 5).value = new Date(invoice.issueDate);
      sheet.getCell(rowNum, 6).value = new Date(invoice.dueDate);
      sheet.getCell(rowNum, 7).value = invoice.total;
      sheet.getCell(rowNum, 8).value = invoice.currency;

      // Formato de fechas y moneda
      sheet.getCell(rowNum, 5).numFmt = 'dd/mm/yyyy';
      sheet.getCell(rowNum, 6).numFmt = 'dd/mm/yyyy';
      sheet.getCell(rowNum, 7).numFmt = '#,##0.00';

      // Color según estado
      if (invoice.status === 'overdue') {
        sheet.getCell(rowNum, 4).font = { color: { argb: 'FFFF0000' } };
      } else if (invoice.status === 'paid') {
        sheet.getCell(rowNum, 4).font = { color: { argb: 'FF008000' } };
      }
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 20; // Número
    sheet.getColumn(2).width = 12; // Tipo
    sheet.getColumn(3).width = 25; // Cliente
    sheet.getColumn(4).width = 12; // Estado
    sheet.getColumn(5).width = 15; // Fecha Emisión
    sheet.getColumn(6).width = 15; // Fecha Vencimiento
    sheet.getColumn(7).width = 15; // Total
    sheet.getColumn(8).width = 10; // Moneda
  }

  /**
   * Crea la hoja de pagos
   */
  private static createPaymentsSheet(sheet: ExcelJS.Worksheet, payments: any[]) {
    // Encabezados
    const headers = ['Número', 'Tipo', 'Estado', 'Método', 'Monto', 'Cuenta', 'Factura', 'Fecha', 'Descripción'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Datos
    payments.forEach((payment, index) => {
      const rowNum = index + 2;
      sheet.getCell(rowNum, 1).value = payment.paymentNumber;
      sheet.getCell(rowNum, 2).value = payment.type === 'income' ? 'Ingreso' : 'Gasto';
      sheet.getCell(rowNum, 3).value = this.translateStatus(payment.status);
      sheet.getCell(rowNum, 4).value = this.translatePaymentMethod(payment.method);
      sheet.getCell(rowNum, 5).value = payment.amount;
      sheet.getCell(rowNum, 6).value = payment.account?.name || 'N/A';
      sheet.getCell(rowNum, 7).value = payment.invoice?.invoiceNumber || 'N/A';
      sheet.getCell(rowNum, 8).value = new Date(payment.paymentDate);
      sheet.getCell(rowNum, 9).value = payment.description;

      // Formato
      sheet.getCell(rowNum, 5).numFmt = '#,##0.00';
      sheet.getCell(rowNum, 8).numFmt = 'dd/mm/yyyy';

      // Color según tipo
      if (payment.type === 'income') {
        sheet.getCell(rowNum, 2).font = { color: { argb: 'FF008000' } };
      } else {
        sheet.getCell(rowNum, 2).font = { color: { argb: 'FFFF0000' } };
      }
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 20;
    sheet.getColumn(7).width = 20;
    sheet.getColumn(8).width = 15;
    sheet.getColumn(9).width = 30;
  }

  /**
   * Crea la hoja de cuentas
   */
  private static createAccountsSheet(sheet: ExcelJS.Worksheet, accounts: any[]) {
    // Encabezados
    const headers = ['Nombre', 'Tipo', 'Estado', 'Balance Inicial', 'Balance Actual', 'Moneda', 'Banco', 'Número Cuenta'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Datos
    accounts.forEach((account, index) => {
      const rowNum = index + 2;
      sheet.getCell(rowNum, 1).value = account.name;
      sheet.getCell(rowNum, 2).value = this.translateAccountType(account.type);
      sheet.getCell(rowNum, 3).value = this.translateStatus(account.status);
      sheet.getCell(rowNum, 4).value = account.initialBalance;
      sheet.getCell(rowNum, 5).value = account.balance;
      sheet.getCell(rowNum, 6).value = account.currency;
      sheet.getCell(rowNum, 7).value = account.bankName || 'N/A';
      sheet.getCell(rowNum, 8).value = account.accountNumber || 'N/A';

      // Formato
      sheet.getCell(rowNum, 4).numFmt = '#,##0.00';
      sheet.getCell(rowNum, 5).numFmt = '#,##0.00';

      // Color según balance
      if (account.balance < 0) {
        sheet.getCell(rowNum, 5).font = { color: { argb: 'FFFF0000' } };
      } else if (account.balance > account.initialBalance) {
        sheet.getCell(rowNum, 5).font = { color: { argb: 'FF008000' } };
      }
    });

    // Total
    const totalRow = accounts.length + 2;
    sheet.getCell(totalRow, 4).value = 'TOTAL:';
    sheet.getCell(totalRow, 4).font = { bold: true };
    sheet.getCell(totalRow, 5).value = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    sheet.getCell(totalRow, 5).font = { bold: true };
    sheet.getCell(totalRow, 5).numFmt = '#,##0.00';

    // Ajustar anchos
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 20;
    sheet.getColumn(8).width = 20;
  }

  /**
   * Crea la hoja de flujo de caja
   */
  private static createCashFlowSheet(sheet: ExcelJS.Worksheet, cashFlow: any) {
    // Título
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FLUJO DE CAJA';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Encabezados
    const headers = ['Mes', 'Ingresos', 'Gastos', 'Flujo Neto'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Datos (si cashFlow es un array)
    if (Array.isArray(cashFlow)) {
      cashFlow.forEach((month, index) => {
        const rowNum = index + 4;
        sheet.getCell(rowNum, 1).value = month.month || `Mes ${index + 1}`;
        sheet.getCell(rowNum, 2).value = month.income || 0;
        sheet.getCell(rowNum, 3).value = month.expenses || 0;
        sheet.getCell(rowNum, 4).value = (month.income || 0) - (month.expenses || 0);

        // Formato
        sheet.getCell(rowNum, 2).numFmt = '#,##0.00';
        sheet.getCell(rowNum, 3).numFmt = '#,##0.00';
        sheet.getCell(rowNum, 4).numFmt = '#,##0.00';

        // Color para flujo neto
        if ((month.income || 0) - (month.expenses || 0) < 0) {
          sheet.getCell(rowNum, 4).font = { color: { argb: 'FFFF0000' } };
        } else {
          sheet.getCell(rowNum, 4).font = { color: { argb: 'FF008000' } };
        }
      });
    }

    // Ajustar anchos
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
  }

  /**
   * Genera HTML para el reporte PDF
   */
  private static generateReportHTML(data: MonthlyReportData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Financiero - ${this.getMonthName(data.month)} ${data.year}</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REPORTE FINANCIERO</h1>
          <h2>${this.getMonthName(data.month).toUpperCase()} ${data.year}</h2>
          <p class="period-status">Estado del Período: <span class="${data.period.status}">${data.period.status === 'closed' ? 'CERRADO' : 'ABIERTO'}</span></p>
        </div>

        <div class="summary-section">
          <h3>RESUMEN EJECUTIVO</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <label>Total Ingresos:</label>
              <span class="amount">$${this.formatCurrency(data.period.totalIncome)}</span>
            </div>
            <div class="summary-item">
              <label>Total Gastos:</label>
              <span class="amount">$${this.formatCurrency(data.period.totalExpenses)}</span>
            </div>
            <div class="summary-item">
              <label>Ingreso Neto:</label>
              <span class="amount ${data.period.netIncome < 0 ? 'negative' : 'positive'}">$${this.formatCurrency(data.period.netIncome)}</span>
            </div>
            <div class="summary-item">
              <label>Balance Total:</label>
              <span class="amount">$${this.formatCurrency(data.summary.totalBalance)}</span>
            </div>
          </div>
        </div>

        <div class="invoices-section">
          <h3>RESUMEN DE FACTURAS</h3>
          <div class="invoices-grid">
            <div class="invoice-stat">
              <label>Total Facturas:</label>
              <span>${data.summary.totalInvoices}</span>
            </div>
            <div class="invoice-stat">
              <label>Pagadas:</label>
              <span class="positive">${data.summary.paidInvoices}</span>
            </div>
            <div class="invoice-stat">
              <label>Pendientes:</label>
              <span>${data.summary.pendingInvoices}</span>
            </div>
            <div class="invoice-stat">
              <label>Vencidas:</label>
              <span class="negative">${data.summary.overdueInvoices}</span>
            </div>
          </div>
        </div>

        <div class="details-section">
          <h3>DETALLE DE FACTURAS</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.invoices.slice(0, 10).map(invoice => `
                <tr>
                  <td>${invoice.invoiceNumber}</td>
                  <td>${invoice.type === 'sent' ? 'Enviada' : 'Recibida'}</td>
                  <td>${invoice.client || invoice.provider || 'N/A'}</td>
                  <td class="status-${invoice.status}">${this.translateStatus(invoice.status)}</td>
                  <td>${new Date(invoice.issueDate).toLocaleDateString('es-ES')}</td>
                  <td>${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</td>
                  <td>$${this.formatCurrency(invoice.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${data.invoices.length > 10 ? `<p class="note">Mostrando 10 de ${data.invoices.length} facturas. Ver archivo Excel para el detalle completo.</p>` : ''}
        </div>

        <div class="accounts-section">
          <h3>ESTADO DE CUENTAS</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Tipo</th>
                <th>Balance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.accounts.map(account => `
                <tr>
                  <td>${account.name}</td>
                  <td>${this.translateAccountType(account.type)}</td>
                  <td class="${account.balance < 0 ? 'negative' : 'positive'}">$${this.formatCurrency(account.balance)}</td>
                  <td>${this.translateStatus(account.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Reporte generado automáticamente por LoyesTask</p>
          <p>Para más detalles, consulte el archivo Excel correspondiente</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Estilos CSS para el PDF
   */
  private static getPDFStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007ACC; padding-bottom: 20px; }
      .header h1 { font-size: 24px; color: #007ACC; margin-bottom: 5px; }
      .header h2 { font-size: 18px; color: #666; margin-bottom: 10px; }
      .period-status { font-size: 14px; }
      .period-status .closed { color: #d32f2f; font-weight: bold; }
      .period-status .open { color: #388e3c; font-weight: bold; }
      
      .summary-section, .invoices-section, .details-section, .accounts-section { margin-bottom: 25px; }
      h3 { font-size: 16px; color: #007ACC; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      
      .summary-grid, .invoices-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
      .summary-item, .invoice-stat { display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 4px; }
      .summary-item label, .invoice-stat label { font-weight: bold; }
      .amount { font-weight: bold; font-size: 14px; }
      .positive { color: #388e3c; }
      .negative { color: #d32f2f; }
      
      .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      .data-table th { background-color: #f5f5f5; font-weight: bold; color: #007ACC; }
      .data-table tbody tr:nth-child(even) { background-color: #fafafa; }
      
      .status-paid { color: #388e3c; font-weight: bold; }
      .status-overdue { color: #d32f2f; font-weight: bold; }
      .status-pending { color: #ff9800; font-weight: bold; }
      
      .note { font-style: italic; color: #666; margin-top: 10px; }
      .footer { margin-top: 40px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 20px; }
    `;
  }

  /**
   * Métodos auxiliares
   */
  private static getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Mes inválido';
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private static translateStatus(status: string): string {
    const translations = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'paid': 'Pagada',
      'overdue': 'Vencida',
      'cancelled': 'Cancelada',
      'pending': 'Pendiente',
      'completed': 'Completado',
      'failed': 'Fallido',
      'active': 'Activa',
      'inactive': 'Inactiva',
      'closed': 'Cerrada'
    };
    return translations[status] || status;
  }

  private static translatePaymentMethod(method: string): string {
    const translations = {
      'cash': 'Efectivo',
      'bank_transfer': 'Transferencia',
      'check': 'Cheque',
      'credit_card': 'Tarjeta Crédito',
      'debit_card': 'Tarjeta Débito',
      'transfer': 'Transferencia',
      'other': 'Otro'
    };
    return translations[method] || method;
  }

  private static translateAccountType(type: string): string {
    const translations = {
      'bank': 'Bancaria',
      'cash': 'Efectivo',
      'credit_card': 'Tarjeta Crédito',
      'savings': 'Ahorros',
      'other': 'Otra'
    };
    return translations[type] || type;
  }
}

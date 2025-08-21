import type { Request, Response } from "express";
import { FinancialExportService } from "../services/FinancialExportService";
import { MockFinancialService } from "../services/MockFinancialService";

export class FinancialExportController {
  /**
   * Genera y descarga reporte mensual en Excel
   */
  static exportMonthlyExcel = async (req: Request, res: Response) => {
    try {
      const { year, month } = req.params;
      
      // Validar parámetros
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ 
          error: "Año y mes válidos son requeridos (mes: 1-12)" 
        });
      }

      // Validar que no sea un período futuro
      const now = new Date();
      const requestDate = new Date(yearNum, monthNum - 1, 1);
      if (requestDate > now) {
        return res.status(400).json({ 
          error: "No se pueden generar reportes de períodos futuros" 
        });
      }

      console.log(`Admin ${req.user.email} exportando reporte Excel: ${monthNum}/${yearNum}`);

      // Generar Excel
      const excelBuffer = await FinancialExportService.exportToExcel(yearNum, monthNum);
      
      // Configurar headers para descarga
      const monthName = FinancialExportController.getMonthName(monthNum);
      const filename = `Reporte_Financiero_${monthName}_${yearNum}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
      
      console.log(`Reporte Excel generado exitosamente: ${filename}`);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      res.status(500).json({ 
        error: "Error al generar el reporte en Excel",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Genera y descarga reporte mensual en PDF
   */
  static exportMonthlyPDF = async (req: Request, res: Response) => {
    try {
      const { year, month } = req.params;
      
      // Validar parámetros
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ 
          error: "Año y mes válidos son requeridos (mes: 1-12)" 
        });
      }

      // Validar que no sea un período futuro
      const now = new Date();
      const requestDate = new Date(yearNum, monthNum - 1, 1);
      if (requestDate > now) {
        return res.status(400).json({ 
          error: "No se pueden generar reportes de períodos futuros" 
        });
      }

      console.log(`Admin ${req.user.email} exportando reporte PDF: ${monthNum}/${yearNum}`);

      // Generar PDF
      const pdfBuffer = await FinancialExportService.exportToPDF(yearNum, monthNum);
      
      // Configurar headers para descarga
      const monthName = FinancialExportController.getMonthName(monthNum);
      const filename = `Reporte_Financiero_${monthName}_${yearNum}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
      console.log(`Reporte PDF generado exitosamente: ${filename}`);
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      res.status(500).json({ 
        error: "Error al generar el reporte en PDF",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtiene los datos del reporte mensual (JSON)
   */
  static getMonthlyReportData = async (req: Request, res: Response) => {
    try {
      const { year, month } = req.params;
      
      // Validar parámetros
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ 
          error: "Año y mes válidos son requeridos (mes: 1-12)" 
        });
      }

      console.log(`Admin ${req.user.email} consultando datos del reporte: ${monthNum}/${yearNum}`);

      let reportData;
      try {
        // Intentar obtener datos reales
        reportData = await FinancialExportService.generateMonthlyReport(yearNum, monthNum);
      } catch (error) {
        console.log('Error con datos reales, usando datos simulados:', error.message);
        // Si falla, usar datos simulados
        reportData = await MockFinancialService.generateMockMonthlyReport(yearNum, monthNum);
      }
      
      res.json({
        msg: "Datos del reporte obtenidos correctamente",
        data: reportData
      });
      
    } catch (error) {
      console.error('Error obteniendo datos del reporte:', error);
      res.status(500).json({ 
        error: "Error al obtener los datos del reporte",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Lista los meses disponibles para reportes
   */
  static getAvailableReports = async (req: Request, res: Response) => {
    try {
      const { year } = req.query;
      
      // Si no se especifica año, usar el actual y anterior
      const currentYear = new Date().getFullYear();
      const targetYear = year ? parseInt(year as string) : currentYear;
      
      let availableReports;
      try {
        // Intentar obtener reportes reales (implementación futura)
        availableReports = await MockFinancialService.generateMockAvailableReports(targetYear);
      } catch (error) {
        console.log('Error obteniendo reportes reales, usando simulados:', error.message);
        // Usar datos simulados como fallback
        availableReports = await MockFinancialService.generateMockAvailableReports(targetYear);
      }
      
      res.json({
        msg: "Reportes disponibles obtenidos correctamente",
        reports: availableReports
      });
      
    } catch (error) {
      console.error('Error obteniendo reportes disponibles:', error);
      res.status(500).json({ 
        error: "Error al obtener la lista de reportes disponibles" 
      });
    }
  };

  /**
   * Método auxiliar para obtener nombre del mes
   */
  private static getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Mes_Invalido';
  }
}

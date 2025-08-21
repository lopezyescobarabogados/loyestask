import { Router } from "express";
import { param, query } from "express-validator";
import { FinancialExportController } from "../controllers/FinancialExportController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/role";
import { authenticateDev, requireAdminDev } from "../middleware/authDev";

const router = Router();

// En desarrollo, usar middleware que puede funcionar sin BD
const authMiddleware = process.env.NODE_ENV === 'development' ? authenticateDev : authenticate;
const adminMiddleware = process.env.NODE_ENV === 'development' ? requireAdminDev : requireAdmin;

// Todas las rutas requieren autenticación y permisos de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Obtener lista de reportes disponibles
router.get(
  "/available",
  query("year")
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage("Año debe estar entre 2020 y 2030"),
  handleInputErrors,
  FinancialExportController.getAvailableReports
);

// Obtener datos del reporte mensual (JSON)
router.get(
  "/monthly/:year/:month/data",
  param("year")
    .isInt({ min: 2020, max: 2030 })
    .withMessage("Año debe estar entre 2020 y 2030"),
  param("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Mes debe estar entre 1 y 12"),
  handleInputErrors,
  FinancialExportController.getMonthlyReportData
);

// Exportar reporte mensual a Excel
router.get(
  "/monthly/:year/:month/excel",
  param("year")
    .isInt({ min: 2020, max: 2030 })
    .withMessage("Año debe estar entre 2020 y 2030"),
  param("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Mes debe estar entre 1 y 12"),
  handleInputErrors,
  FinancialExportController.exportMonthlyExcel
);

// Exportar reporte mensual a PDF
router.get(
  "/monthly/:year/:month/pdf",
  param("year")
    .isInt({ min: 2020, max: 2030 })
    .withMessage("Año debe estar entre 2020 y 2030"),
  param("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Mes debe estar entre 1 y 12"),
  handleInputErrors,
  FinancialExportController.exportMonthlyPDF
);

export default router;

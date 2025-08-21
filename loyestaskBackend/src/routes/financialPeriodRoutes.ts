import { Router } from "express";
import { body, param, query } from "express-validator";
import { FinancialPeriodController } from "../controllers/FinancialPeriodController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/role";

const router = Router();

router.use(authenticate);

// Obtener todos los períodos financieros
router.get(
  "/",
  query("year")
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage("El año debe estar entre 2020 y 2100"),
  query("status")
    .optional()
    .isIn(["open", "closed"])
    .withMessage("Estado de período inválido"),
  handleInputErrors,
  FinancialPeriodController.getFinancialPeriods
);

// Obtener período actual
router.get("/current", FinancialPeriodController.getCurrentPeriod);

// Obtener años disponibles
router.get("/years", FinancialPeriodController.getAvailableYears);

// Obtener resumen de un período específico
router.get(
  "/:year/:month/summary",
  param("year")
    .isInt({ min: 2020, max: 2100 })
    .withMessage("El año debe estar entre 2020 y 2100"),
  param("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("El mes debe estar entre 1 y 12"),
  handleInputErrors,
  FinancialPeriodController.getPeriodSummary
);

// Obtener período por ID
router.get(
  "/:periodId",
  param("periodId")
    .isMongoId()
    .withMessage("ID de período inválido"),
  handleInputErrors,
  FinancialPeriodController.getFinancialPeriodById
);

// Cerrar período (solo admin)
router.patch(
  "/:periodId/close",
  param("periodId")
    .isMongoId()
    .withMessage("ID de período inválido"),
  handleInputErrors,
  isAdmin,
  FinancialPeriodController.closePeriod
);

// Reabrir período (solo admin)
router.patch(
  "/:periodId/reopen",
  param("periodId")
    .isMongoId()
    .withMessage("ID de período inválido"),
  handleInputErrors,
  isAdmin,
  FinancialPeriodController.reopenPeriod
);

export default router;

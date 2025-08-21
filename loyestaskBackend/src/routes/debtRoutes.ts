import { Router } from "express";
import { body, param, query } from "express-validator";
import { DebtController } from "../controllers/DebtController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Validaciones para deuda
const validateDebt = [
  body("client")
    .isMongoId()
    .withMessage("ID de cliente inválido"),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 5, max: 500 })
    .withMessage("La descripción debe tener entre 5 y 500 caracteres"),
  body("totalAmount")
    .isNumeric()
    .withMessage("El monto total debe ser un número")
    .isFloat({ min: 0.01 })
    .withMessage("El monto total debe ser mayor a 0"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("La prioridad debe ser 'low', 'medium', 'high' o 'urgent'"),
  body("dueDate")
    .isISO8601()
    .withMessage("La fecha de vencimiento debe ser una fecha válida")
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error("La fecha de vencimiento no puede ser anterior a hoy");
      }
      return true;
    }),
  body("paymentTerms")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Los términos de pago deben estar entre 1 y 365 días"),
  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("La tasa de interés debe estar entre 0 y 100"),
  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("Las notificaciones por email deben ser verdadero o falso"),
  handleInputErrors
];

const validateUpdateDebt = [
  body("description")
    .optional()
    .notEmpty()
    .withMessage("La descripción no puede estar vacía")
    .isLength({ min: 5, max: 500 })
    .withMessage("La descripción debe tener entre 5 y 500 caracteres"),
  body("totalAmount")
    .optional()
    .isNumeric()
    .withMessage("El monto total debe ser un número")
    .isFloat({ min: 0.01 })
    .withMessage("El monto total debe ser mayor a 0"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("La prioridad debe ser 'low', 'medium', 'high' o 'urgent'"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de vencimiento debe ser una fecha válida"),
  body("paymentTerms")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Los términos de pago deben estar entre 1 y 365 días"),
  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("La tasa de interés debe estar entre 0 y 100"),
  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("Las notificaciones por email deben ser verdadero o falso"),
  handleInputErrors
];

// Obtener todas las deudas
router.get("/", DebtController.getDebts);

// Obtener estadísticas de deudas
router.get("/stats", DebtController.getDebtStats);

// Obtener deudas vencidas
router.get("/overdue", DebtController.getOverdueDebts);

// Obtener deudas próximas a vencer
router.get("/upcoming", 
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Los días deben estar entre 1 y 365"),
  handleInputErrors,
  DebtController.getUpcomingDebts
);

// Obtener una deuda por ID
router.get("/:id", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  handleInputErrors,
  DebtController.getDebtById
);

// Crear nueva deuda
router.post("/", validateDebt, DebtController.createDebt);

// Actualizar deuda
router.put("/:id", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  validateUpdateDebt,
  DebtController.updateDebt
);

// Marcar deuda como pagada
router.patch("/:id/mark-paid", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  handleInputErrors,
  DebtController.markAsPaid
);

// Actualizar estado de deuda
router.patch("/:id/status", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  body("status").isIn(['pending', 'partial', 'paid', 'overdue', 'cancelled']).withMessage("Estado inválido"),
  handleInputErrors,
  DebtController.updateDebtStatus
);

// Enviar notificación de deuda
router.post("/:id/notification", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  handleInputErrors,
  DebtController.sendDebtNotification
);

// Eliminar deuda
router.delete("/:id", 
  param("id").isMongoId().withMessage("ID de deuda inválido"),
  handleInputErrors,
  DebtController.deleteDebt
);

export default router;

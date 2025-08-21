import { Router } from "express";
import { body, param, query } from "express-validator";
import { PaymentController } from "../controllers/PaymentController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { paymentExists, paymentOwner, accountExists } from "../middleware/financial";

const router = Router();

router.use(authenticate);

// Crear nuevo pago
router.post(
  "/",
  body("type")
    .isIn(["income", "expense"])
    .withMessage("El tipo de pago debe ser 'income' o 'expense'"),
  body("method")
    .isIn(["cash", "bank_transfer", "check", "credit_card", "debit_card", "transfer", "other"])
    .withMessage("Método de pago inválido"),
  body("amount")
    .isNumeric()
    .withMessage("El monto debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El monto debe ser mayor a 0"),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria"),
  body("account")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  body("invoice")
    .optional()
    .isMongoId()
    .withMessage("ID de factura inválido"),
  body("category")
    .optional()
    .isLength({ min: 1 })
    .withMessage("La categoría no puede estar vacía"),
  handleInputErrors,
  accountExists,
  PaymentController.createPayment
);

// Obtener todos los pagos con filtros
router.get(
  "/",
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),
  query("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Tipo de pago inválido"),
  query("status")
    .optional()
    .isIn(["pending", "completed", "failed", "cancelled"])
    .withMessage("Estado de pago inválido"),
  query("method")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "credit_card", "debit_card", "transfer", "other"])
    .withMessage("Método de pago inválido"),
  handleInputErrors,
  PaymentController.getPayments
);

// Obtener pagos por tipo
router.get(
  "/type/:type",
  param("type")
    .isIn(["income", "expense"])
    .withMessage("Tipo de pago inválido"),
  handleInputErrors,
  PaymentController.getPaymentsByType
);

// Obtener resumen de pagos
router.get("/summary", PaymentController.getPaymentsSummary);

// Obtener pago por ID
router.get(
  "/:paymentId",
  param("paymentId")
    .isMongoId()
    .withMessage("ID de pago inválido"),
  handleInputErrors,
  paymentExists,
  paymentOwner,
  PaymentController.getPaymentById
);

// Actualizar pago
router.put(
  "/:paymentId",
  param("paymentId")
    .isMongoId()
    .withMessage("ID de pago inválido"),
  body("amount")
    .optional()
    .isNumeric()
    .withMessage("El monto debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El monto debe ser mayor a 0"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("La descripción no puede estar vacía"),
  body("method")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "credit_card", "debit_card", "transfer", "other"])
    .withMessage("Método de pago inválido"),
  handleInputErrors,
  paymentExists,
  paymentOwner,
  PaymentController.updatePayment
);

// Cambiar estado de pago
router.patch(
  "/:paymentId/status",
  param("paymentId")
    .isMongoId()
    .withMessage("ID de pago inválido"),
  body("status")
    .isIn(["pending", "completed", "failed", "cancelled"])
    .withMessage("Estado de pago inválido"),
  handleInputErrors,
  paymentExists,
  paymentOwner,
  PaymentController.updatePaymentStatus
);

// Eliminar pago
router.delete(
  "/:paymentId",
  param("paymentId")
    .isMongoId()
    .withMessage("ID de pago inválido"),
  handleInputErrors,
  paymentExists,
  paymentOwner,
  PaymentController.deletePayment
);

export default router;

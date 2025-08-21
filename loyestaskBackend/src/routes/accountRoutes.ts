import { Router } from "express";
import { body, param, query } from "express-validator";
import { AccountController } from "../controllers/AccountController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { accountExists, accountOwner, validateTransferAccounts } from "../middleware/financial";

const router = Router();

router.use(authenticate);

// Crear nueva cuenta
router.post(
  "/",
  body("name")
    .notEmpty()
    .withMessage("El nombre de la cuenta es obligatorio"),
  body("type")
    .isIn(["bank", "cash", "credit_card", "savings", "other"])
    .withMessage("Tipo de cuenta inválido"),
  body("initialBalance")
    .optional()
    .isNumeric()
    .withMessage("El balance inicial debe ser un número"),
  body("accountNumber")
    .optional()
    .isLength({ min: 1 })
    .withMessage("El número de cuenta no puede estar vacío"),
  body("bankName")
    .optional()
    .isLength({ min: 1 })
    .withMessage("El nombre del banco no puede estar vacío"),
  handleInputErrors,
  AccountController.createAccount
);

// Obtener todas las cuentas
router.get(
  "/",
  query("type")
    .optional()
    .isIn(["bank", "cash", "credit_card", "savings", "other"])
    .withMessage("Tipo de cuenta inválido"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "closed"])
    .withMessage("Estado de cuenta inválido"),
  handleInputErrors,
  AccountController.getAccounts
);

// Obtener balance total
router.get("/balance", AccountController.getTotalBalance);

// Transferir entre cuentas
router.post(
  "/transfer",
  body("fromAccountId")
    .isMongoId()
    .withMessage("ID de cuenta origen inválido"),
  body("toAccountId")
    .isMongoId()
    .withMessage("ID de cuenta destino inválido"),
  body("amount")
    .isNumeric()
    .withMessage("El monto debe ser un número")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser mayor a 0"),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria"),
  handleInputErrors,
  validateTransferAccounts,
  AccountController.transferBetweenAccounts
);

// Obtener cuenta por ID
router.get(
  "/:accountId",
  param("accountId")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  handleInputErrors,
  accountExists,
  AccountController.getAccountById
);

// Obtener movimientos de una cuenta
router.get(
  "/:accountId/movements",
  param("accountId")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),
  handleInputErrors,
  accountExists,
  AccountController.getAccountMovements
);

// Actualizar cuenta
router.put(
  "/:accountId",
  param("accountId")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío"),
  body("accountNumber")
    .optional()
    .isLength({ min: 1 })
    .withMessage("El número de cuenta no puede estar vacío"),
  body("bankName")
    .optional()
    .isLength({ min: 1 })
    .withMessage("El nombre del banco no puede estar vacío"),
  handleInputErrors,
  accountExists,
  accountOwner,
  AccountController.updateAccount
);

// Cambiar estado de cuenta
router.patch(
  "/:accountId/status",
  param("accountId")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  body("status")
    .isIn(["active", "inactive", "closed"])
    .withMessage("Estado de cuenta inválido"),
  handleInputErrors,
  accountExists,
  accountOwner,
  AccountController.updateAccountStatus
);

// Eliminar cuenta
router.delete(
  "/:accountId",
  param("accountId")
    .isMongoId()
    .withMessage("ID de cuenta inválido"),
  handleInputErrors,
  accountExists,
  accountOwner,
  AccountController.deleteAccount
);

export default router;

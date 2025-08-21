import { Router } from "express";
import { body, param, query } from "express-validator";
import { InvoiceController } from "../controllers/InvoiceController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { invoiceExists, invoiceOwner } from "../middleware/financial";

const router = Router();

router.use(authenticate);

// Crear nueva factura
router.post(
  "/",
  body("type")
    .isIn(["sent", "received"])
    .withMessage("El tipo de factura debe ser 'sent' o 'received'"),
  body("client")
    .notEmpty()
    .withMessage("El cliente es obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria"),
  body("total")
    .isNumeric()
    .withMessage("El total debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El total debe ser mayor a 0"),
  body("dueDate")
    .isISO8601()
    .withMessage("La fecha de vencimiento debe ser válida"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("La moneda debe tener 3 caracteres"),
  handleInputErrors,
  InvoiceController.createInvoice
);

// Obtener todas las facturas con filtros
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
  query("status")
    .optional()
    .isIn(["draft", "sent", "paid", "overdue", "cancelled"])
    .withMessage("Estado de factura inválido"),
  query("type")
    .optional()
    .isIn(["sent", "received"])
    .withMessage("Tipo de factura inválido"),
  handleInputErrors,
  InvoiceController.getInvoices
);

// Obtener facturas vencidas
router.get("/overdue", InvoiceController.getOverdueInvoices);

// Obtener resumen de facturas
router.get("/summary", InvoiceController.getInvoicesSummary);

// Obtener factura por ID
router.get(
  "/:invoiceId",
  param("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  handleInputErrors,
  invoiceExists,
  invoiceOwner,
  InvoiceController.getInvoiceById
);

// Actualizar factura
router.put(
  "/:invoiceId",
  param("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  body("client")
    .optional()
    .notEmpty()
    .withMessage("El cliente no puede estar vacío"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("La descripción no puede estar vacía"),
  body("total")
    .optional()
    .isNumeric()
    .withMessage("El total debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El total debe ser mayor a 0"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de vencimiento debe ser válida"),
  handleInputErrors,
  invoiceExists,
  invoiceOwner,
  InvoiceController.updateInvoice
);

// Cambiar estado de factura
router.patch(
  "/:invoiceId/status",
  param("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  body("status")
    .isIn(["draft", "sent", "paid", "overdue", "cancelled"])
    .withMessage("Estado de factura inválido"),
  handleInputErrors,
  invoiceExists,
  invoiceOwner,
  InvoiceController.updateInvoiceStatus
);

// Eliminar factura
router.delete(
  "/:invoiceId",
  param("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  handleInputErrors,
  invoiceExists,
  invoiceOwner,
  InvoiceController.deleteInvoice
);

export default router;

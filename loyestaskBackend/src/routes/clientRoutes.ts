import { Router } from "express";
import { body, param, query } from "express-validator";
import { ClientController } from "../controllers/ClientController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Validaciones para cliente
const validateClient = [
  body("name")
    .notEmpty()
    .withMessage("El nombre del cliente es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("type")
    .isIn(["individual", "company", "government"])
    .withMessage("El tipo de cliente debe ser 'individual', 'company' o 'government'"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("El email debe tener un formato válido"),
  body("phone")
    .optional()
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),
  body("taxId")
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage("El documento fiscal debe tener entre 5 y 20 caracteres"),
  body("creditLimit")
    .optional()
    .isNumeric()
    .withMessage("El límite de crédito debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El límite de crédito debe ser mayor o igual a 0"),
  body("paymentTerms")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Los términos de pago deben estar entre 1 y 365 días"),
  handleInputErrors
];

const validateUpdateClient = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre del cliente no puede estar vacío")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("type")
    .optional()
    .isIn(["individual", "company", "government"])
    .withMessage("El tipo de cliente debe ser 'individual', 'company' o 'government'"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "blocked"])
    .withMessage("El estado debe ser 'active', 'inactive' o 'blocked'"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("El email debe tener un formato válido"),
  body("phone")
    .optional()
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),
  body("taxId")
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage("El documento fiscal debe tener entre 5 y 20 caracteres"),
  body("creditLimit")
    .optional()
    .isNumeric()
    .withMessage("El límite de crédito debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El límite de crédito debe ser mayor o igual a 0"),
  body("paymentTerms")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Los términos de pago deben estar entre 1 y 365 días"),
  handleInputErrors
];

// Obtener todos los clientes
router.get("/", ClientController.getClients);

// Buscar clientes
router.get("/search",
  query("q").optional().isString().withMessage("Query de búsqueda debe ser un string"),
  handleInputErrors,
  ClientController.searchClients
);

// Obtener estadísticas de clientes
router.get("/stats", ClientController.getClientsStats);

// Obtener un cliente por ID
router.get("/:id", 
  param("id").isMongoId().withMessage("ID de cliente inválido"),
  handleInputErrors,
  ClientController.getClientById
);

// Obtener resumen de un cliente (deudas, pagos, etc.)
router.get("/:id/summary", 
  param("id").isMongoId().withMessage("ID de cliente inválido"),
  handleInputErrors,
  ClientController.getClientSummary
);

// Crear nuevo cliente
router.post("/", validateClient, ClientController.createClient);

// Actualizar cliente
router.put("/:id", 
  param("id").isMongoId().withMessage("ID de cliente inválido"),
  validateUpdateClient,
  ClientController.updateClient
);

// Eliminar cliente
router.delete("/:id", 
  param("id").isMongoId().withMessage("ID de cliente inválido"),
  handleInputErrors,
  ClientController.deleteClient
);

export default router;

import { Router } from 'express'
import { body, param } from 'express-validator'
import { UserController } from '../controllers/UserController'
import { handleInputErrors } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import { requireAdmin } from '../middleware/role'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Crear usuario (solo admin)
router.post('/',
    requireAdmin,
    body('name')
        .notEmpty().withMessage('El nombre no puede ir vacío'),
    body('email')
        .isEmail().withMessage('E-mail no válido'),
    body('password')
        .isLength({ min: 8 }).withMessage('El password es muy corto, mínimo 8 caracteres'),
    body('role')
        .optional()
        .isIn(['admin', 'user']).withMessage('Rol no válido'),
    handleInputErrors,
    UserController.createUser
)

// Obtener todos los usuarios (solo admin)
router.get('/',
    requireAdmin,
    UserController.getAllUsers
)

// Obtener usuario por ID (solo admin)
router.get('/:userId',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    UserController.getUserById
)

// Actualizar usuario (solo admin)
router.put('/:userId',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID no válido'),
    body('name')
        .notEmpty().withMessage('El nombre no puede ir vacío'),
    body('email')
        .isEmail().withMessage('E-mail no válido'),
    body('role')
        .isIn(['admin', 'user']).withMessage('Rol no válido'),
    handleInputErrors,
    UserController.updateUser
)

// Eliminar usuario (solo admin)
router.delete('/:userId',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    UserController.deleteUser
)

// Cambiar contraseña de usuario (solo admin)
router.put('/:userId/password',
    requireAdmin,
    param('userId').isMongoId().withMessage('ID no válido'),
    body('password')
        .isLength({ min: 8 }).withMessage('El password es muy corto, mínimo 8 caracteres'),
    handleInputErrors,
    UserController.changeUserPassword
)

export default router

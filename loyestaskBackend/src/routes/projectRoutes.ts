import { Router } from "express";
import { body, param } from "express-validator";
import { ProjectController } from "../controllers/ProjectController";
import { handleInputErrors } from "../middleware/validation";
import { TaskController } from "../controllers/TaskController";
import Project from "../models/Project";
import { projectExists } from "../middleware/project";
import { hasAuthorization, taskExists, taskBelongsToProject } from "../middleware/task";
import { authenticate } from "../middleware/auth";
import { TeamMemberController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";
import { FileController } from "../controllers/FileController";
import { uploadMiddleware, handleMulterError } from "../services/FileService";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  body("projectName")
    .notEmpty()
    .withMessage("El nombre del Proyecto es obligatorio"),
  body("clientName")
    .notEmpty()
    .withMessage("El nombre del Cliente es obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("La Descripcion del Projecto es obligatoria"),
  handleInputErrors,
  ProjectController.createProject
);
 
router.get("/", ProjectController.getAllProjects);

// Project-level middleware
router.param("projectId", projectExists);

router.get(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  ProjectController.getProjectsById
);

router.put(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Id no valido"),
  body("projectName")
    .notEmpty()
    .withMessage("El nombre del Proyecto es obligatorio"),
  body("clientName")
    .notEmpty()
    .withMessage("El nombre del Cliente es obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("La Descripcion del Projecto es obligatoria"),
  handleInputErrors,
  hasAuthorization,
  ProjectController.updateProject
);

router.delete(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  hasAuthorization,
  ProjectController.deleteProject
);

router.post(
  "/:projectId/priority",
  param("projectId").isMongoId().withMessage("Id no valido"),
   body("priority")
    .notEmpty().withMessage("La prioridad del proyecto es obligatoria"),
  handleInputErrors,
  ProjectController.updatePriority,
);

router.post(
  "/:projectId/status",
  param("projectId").isMongoId().withMessage("Id no valido"),
   body("status")
    .notEmpty().withMessage("El estado del proyecto es obligatorio"),
  handleInputErrors,
  hasAuthorization,
  ProjectController.updateStatus,
);

/** Routes for tasks */
router.post(
  "/:projectId/tasks",
  hasAuthorization,
  body("name").notEmpty().withMessage("El nombre de la Tarea es obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("La Descripcion de la Tarea es obligatoria"),
  handleInputErrors,
  TaskController.createTask
);

router.get(
  "/:projectId/tasks",
  TaskController.getProjectTasks
);

// Task-level routes with explicit middleware
router.get(
  "/:projectId/tasks/:taskId",
  param("taskId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.getTaskById
);

router.put(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Id no valido"),
  body("name").notEmpty().withMessage("El nombre de la Tarea es obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("La Descripcion de la Tarea es obligatoria"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.updateTask
);

router.delete(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.deleteTask
);

router.post("/:projectId/tasks/:taskId/status",
  param("taskId").isMongoId().withMessage("Id no valido"),
  body("status")
    .notEmpty().withMessage("El estado es obligatorio"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.updateStatus
);

// Asignar colaborador a una tarea (solo manager del proyecto)
router.post(
  "/:projectId/tasks/:taskId/collaborators",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Id no valido"),
  body('userId').isMongoId().withMessage('ID de usuario no valido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.addCollaborator
);

// Listar colaboradores disponibles (manager o miembros no asignados)
router.get(
  "/:projectId/tasks/:taskId/collaborators/available",
  param("taskId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.getAvailableCollaborators
);

// Eliminar colaborador de una tarea (solo manager del proyecto)
router.delete(
  "/:projectId/tasks/:taskId/collaborators/:userId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Id no valido"),
  param('userId').isMongoId().withMessage('ID de usuario no valido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  TaskController.removeCollaborator
);

/** Routes for teams */
router.post("/:projectId/team/find",
  body('email')
    .isEmail().toLowerCase().withMessage('Correo no vàlido'), 
  handleInputErrors,
  TeamMemberController.findMemberByEmail
);

router.get("/:projectId/team",
  TeamMemberController.getProjectTeam
);

router.post("/:projectId/team",
  body('id')
    .isMongoId().withMessage('ID no valido'),
  handleInputErrors,
  TeamMemberController.addMemberById
);

router.delete("/:projectId/team/:userId",
  param('userId')
    .isMongoId().withMessage('ID no valido'),
  handleInputErrors,
  TeamMemberController.removeMemberById
);

/** Routes for Notes */
router.post('/:projectId/tasks/:taskId/notes',
  param("taskId").isMongoId().withMessage("Id no valido"),
  body('content')
    .notEmpty().withMessage('El contenido de la nota es obligatorio'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  NoteController.createNote
);

router.get('/:projectId/tasks/:taskId/notes',
  param("taskId").isMongoId().withMessage("Id no valido"),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  NoteController.getTaskNotes
);

router.delete('/:projectId/tasks/:taskId/notes/:noteId',
  param('taskId').isMongoId().withMessage('ID de tarea no valido'),
  param('noteId').isMongoId().withMessage('ID de nota no valido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  NoteController.deleteNote
);

/** Routes for Files */
// Subir archivos a una tarea
router.post('/:projectId/tasks/:taskId/files',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  uploadMiddleware.array('files', 10), // Máximo 10 archivos por petición
  handleMulterError,
  FileController.uploadFiles
);

// Obtener lista de archivos de una tarea
router.get('/:projectId/tasks/:taskId/files',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  FileController.getTaskFiles
);

// Descargar un archivo específico
router.get('/:projectId/tasks/:taskId/files/:fileId/download',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  param('fileId').isMongoId().withMessage('ID de archivo no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  FileController.downloadFile
);

// Eliminar un archivo específico
router.delete('/:projectId/tasks/:taskId/files/:fileId',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  param('fileId').isMongoId().withMessage('ID de archivo no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  FileController.deleteFile
);

// Reemplazar un archivo existente
router.put('/:projectId/tasks/:taskId/files/:fileId',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  param('fileId').isMongoId().withMessage('ID de archivo no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  uploadMiddleware.single('file'),
  handleMulterError,
  FileController.replaceFile
);

// Obtener estadísticas de archivos de una tarea
router.get('/:projectId/tasks/:taskId/files/stats',
  param('taskId').isMongoId().withMessage('ID de tarea no válido'),
  handleInputErrors,
  taskExists,
  taskBelongsToProject,
  FileController.getFileStats
);

export default router;

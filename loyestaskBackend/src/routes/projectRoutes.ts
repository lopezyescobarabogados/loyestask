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

export default router;

import type { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import Note from '../models/Note';
import { PDFService, ProjectPDFData } from '../services/PDFService';

export class PDFController {
  /**
   * Genera y descarga un PDF resumido de todas las tareas activas para administradores
   */
  static generateAdminSummaryPDF = async (req: Request, res: Response) => {
    try {
      // Obtener todos los proyectos activos (no completados) con colaboradores
      const projects = await Project.find({ 
        status: 'active' 
      })
        .populate('manager', 'name email')
        .populate('team', 'name email') // Agregar población de colaboradores
        .lean();

      if (!projects || projects.length === 0) {
        res.status(404).json({ error: 'No se encontraron proyectos activos' });
        return;
      }

      // Obtener todas las tareas activas de todos los proyectos activos
      const projectIds = projects.map(project => project._id);
      const tasks = await Task.find({ 
        project: { $in: projectIds },
        status: { $ne: 'completed' } // Solo tareas NO completadas
      })
        .populate('project', 'projectName clientName')
        .lean();

      // Agrupar tareas por proyecto
      const tasksByProject = tasks.reduce((acc: any, task: any) => {
        const projectId = task.project._id.toString();
        if (!acc[projectId]) {
          acc[projectId] = {
            project: task.project,
            tasks: []
          };
        }
        acc[projectId].tasks.push(task);
        return acc;
      }, {});

      // Combinar datos para el PDF
      const summaryData = {
        projects: projects.map(project => ({
          ...project,
          tasks: tasksByProject[project._id.toString()]?.tasks || []
        }))
      };

      // Generar el PDF
      const pdfBuffer = await PDFService.generateAdminSummaryPDF(summaryData);

      // Configurar headers para descarga
      const filename = `Reporte_Resumido_Tareas_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generando PDF resumido:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al generar el PDF resumido' 
      });
    }
  };

  /**
   * Genera y descarga un PDF completo del proyecto
   */
  static generateProjectPDF = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Buscar el proyecto con todos los datos necesarios
      const project = await Project.findById(projectId)
        .populate('manager', 'name email')
        .populate('team', 'name email')
        .lean();

      if (!project) {
        const error = new Error('Proyecto no encontrado');
        res.status(404).json({ error: error.message });
        return;
      }

      // Verificar permisos - manager o miembro del equipo
      const hasAccess = 
        project.manager._id.toString() === userId ||
        project.team.some((member: any) => member._id.toString() === userId);

      if (!hasAccess) {
        const error = new Error('No tienes permisos para acceder a este proyecto');
        res.status(403).json({ error: error.message });
        return;
      }

      // Obtener todas las tareas del proyecto con sus datos completos
      const tasks = await Task.find({ project: projectId })
        .populate('collaborators', 'name email')
        .populate('completedBy.user', 'name email')
        .lean();

      // Obtener todas las notas de las tareas
      const taskIds = tasks.map(task => task._id);
      const notes = await Note.find({ task: { $in: taskIds } })
        .populate('createdBy', 'name email')
        .lean();

      // Agrupar notas por tarea
      const notesByTask = notes.reduce((acc: any, note: any) => {
        const taskId = note.task.toString();
        if (!acc[taskId]) acc[taskId] = [];
        acc[taskId].push(note);
        return acc;
      }, {});

      // Combinar datos para el PDF
      const tasksWithNotes = tasks.map(task => ({
        ...task,
        notes: notesByTask[task._id.toString()] || []
      }));

      const projectData: ProjectPDFData = {
        project: {
          ...project,
          tasks: tasksWithNotes
        } as any
      };

      // Generar el PDF
      const pdfBuffer = await PDFService.generateProjectPDF(projectData);

      // Configurar headers para descarga
      const filename = `Proyecto_${project.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generando PDF del proyecto:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al generar el PDF' 
      });
    }
  };

  /**
   * Genera una vista previa del PDF del proyecto (para mostrar en navegador)
   */
  static previewProjectPDF = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Buscar el proyecto con todos los datos necesarios
      const project = await Project.findById(projectId)
        .populate('manager', 'name email')
        .populate('team', 'name email')
        .lean();

      if (!project) {
        const error = new Error('Proyecto no encontrado');
        res.status(404).json({ error: error.message });
        return;
      }

      // Verificar permisos
      const hasAccess = 
        project.manager._id.toString() === userId ||
        project.team.some((member: any) => member._id.toString() === userId);

      if (!hasAccess) {
        const error = new Error('No tienes permisos para acceder a este proyecto');
        res.status(403).json({ error: error.message });
        return;
      }

      // Obtener datos del proyecto (misma lógica que generateProjectPDF)
      const tasks = await Task.find({ project: projectId })
        .populate('collaborators', 'name email')
        .populate('completedBy.user', 'name email')
        .lean();

      const taskIds = tasks.map(task => task._id);
      const notes = await Note.find({ task: { $in: taskIds } })
        .populate('createdBy', 'name email')
        .lean();

      const notesByTask = notes.reduce((acc: any, note: any) => {
        const taskId = note.task.toString();
        if (!acc[taskId]) acc[taskId] = [];
        acc[taskId].push(note);
        return acc;
      }, {});

      const tasksWithNotes = tasks.map(task => ({
        ...task,
        notes: notesByTask[task._id.toString()] || []
      }));

      const projectData: ProjectPDFData = {
        project: {
          ...project,
          tasks: tasksWithNotes
        } as any
      };

      // Generar el PDF
      const pdfBuffer = await PDFService.generateProjectPDF(projectData);

      // Configurar headers para vista previa en navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');

      // Enviar el PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generando vista previa del PDF:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al generar la vista previa del PDF' 
      });
    }
  };

  /**
   * Obtiene información del proyecto para mostrar antes de generar el PDF
   */
  static getProjectInfo = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await Project.findById(projectId)
        .populate('manager', 'name email')
        .populate('team', 'name email')
        .select('projectName clientName description status priority createdAt');

      if (!project) {
        const error = new Error('Proyecto no encontrado');
        res.status(404).json({ error: error.message });
        return;
      }

      // Verificar permisos
      const hasAccess = 
        project.manager._id.toString() === userId ||
        project.team.some((member: any) => member._id.toString() === userId);

      if (!hasAccess) {
        const error = new Error('No tienes permisos para acceder a este proyecto');
        res.status(403).json({ error: error.message });
        return;
      }

      // Obtener estadísticas del proyecto
      const tasksCount = await Task.countDocuments({ project: projectId });
      const completedTasksCount = await Task.countDocuments({ 
        project: projectId, 
        status: 'completed' 
      });
      
      const taskIds = await Task.find({ project: projectId }).select('_id');
      const notesCount = await Note.countDocuments({ 
        task: { $in: taskIds.map(t => t._id) } 
      });

      const projectInfo = {
        _id: project._id,
        projectName: project.projectName,
        clientName: project.clientName,
        description: project.description,
        status: project.status,
        priority: project.priority,
        manager: project.manager,
        teamSize: project.team.length + 1, // +1 para incluir el manager
        statistics: {
          totalTasks: tasksCount,
          completedTasks: completedTasksCount,
          totalNotes: notesCount,
          completionPercentage: tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0
        }
      };

      res.json(projectInfo);

    } catch (error) {
      console.error('Error obteniendo información del proyecto:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al obtener la información del proyecto' 
      });
    }
  };
}

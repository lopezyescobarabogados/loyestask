import type { Request, Response } from "express";
import User from "../models/User";
import UserPerformance, { IUserPerformance } from "../models/UserPerformance";
import UserEvaluation from "../models/UserEvaluation";
import { IProject } from "../models/Project";
import { ITask } from "../models/Task";
import { calculatePerformanceMetrics, calculateWorkingDays } from "../utils/workingDays";
import { calculateAutomatedMetrics, evaluatePerformanceAutomatically, generateMonthlyReport } from "../utils/automatedMetrics";

export class PerformanceController {
  /**
   * Obtener métricas de rendimiento de todos los usuarios (solo admin)
   */
  static getAllUsersPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = 30 } = req.query; // período en días, por defecto 30
      const periodDays = parseInt(period as string);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      const users = await User.find({ role: 'user' }).select('_id name email');
      
      const usersPerformance = await Promise.all(
        users.map(async (user) => {
          // Filtrar solo registros válidos y completados con agregación optimizada
          const performanceAggregation = await UserPerformance.aggregate([
            {
              $match: {
                user: user._id,
                createdAt: { $gte: startDate },
                isCompleted: true,
                completionTime: { $ne: null, $exists: true },
                isOnTime: { $ne: null, $exists: true }
              }
            },
            {
              $lookup: {
                from: 'tasks',
                localField: 'task',
                foreignField: '_id',
                as: 'taskData',
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            {
              $lookup: {
                from: 'projects',
                localField: 'project',
                foreignField: '_id',
                as: 'projectData',
                pipeline: [{ $project: { projectName: 1 } }]
              }
            },
            {
              $project: {
                completionTime: 1,
                isOnTime: 1,
                dueDate: 1,
                createdAt: 1,
                task: { $arrayElemAt: ['$taskData', 0] },
                project: { $arrayElemAt: ['$projectData', 0] },
                statusChanges: 1
              }
            }
          ]);

          const performance = await UserPerformance.find({
            user: user._id,
            createdAt: { $gte: startDate }
          }).lean(); // Usar lean() para mejor performance
          const completedTasks = performanceAggregation;
          
          const metricsData = completedTasks.map(p => ({
            completionTime: p.completionTime!,
            isOnTime: p.isOnTime!,
            dueDate: p.dueDate,
            createdAt: p.createdAt
          }));
          const metrics = calculatePerformanceMetrics(metricsData);
          
          // Obtener evaluación más reciente
          const latestEvaluation = await UserEvaluation.findOne({
            user: user._id
          }).sort({ createdAt: -1 });
          
          // Calcular métricas automatizadas objetivas
          const automatedMetrics = calculateAutomatedMetrics(performance, periodDays);
          const performanceEvaluation = evaluatePerformanceAutomatically(automatedMetrics);

          return {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email
            },
            metrics: {
              ...metrics,
              totalTasks: performance.length,
              completedTasks: completedTasks.length,
              tasksInProgress: performance.filter(p => !p.isCompleted).length,
            },
            automatedMetrics,
            performanceEvaluation,
            latestEvaluation: latestEvaluation ? {
              score: latestEvaluation.score,
              date: latestEvaluation.createdAt
            } : null,
            performance: completedTasks.map(p => ({
              task: p.task,
              project: p.project,
              completionTime: p.completionTime,
              isCompleted: true,
              isOnTime: p.isOnTime,
              statusChanges: p.statusChanges
            }))
          };
        })
      );
      
      res.json(usersPerformance);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al obtener métricas de rendimiento:', error);
      }
      res.status(500).json({ error: "Error al obtener métricas de rendimiento" });
    }
  };

  /**
   * Obtener métricas detalladas de un usuario específico (solo admin)
   */
  static getUserPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { period = 90 } = req.query;
      const periodDays = parseInt(period as string);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      const user = await User.findById(userId).select('name email role');
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      
      const performance = await UserPerformance.find({
        user: userId,
        createdAt: { $gte: startDate }
      }).populate('task', 'name description').populate('project', 'projectName clientName');
      
      const completedTasks = performance.filter(p => p.isCompleted && p.completionTime != null);
      const metricsData = completedTasks.map(p => ({
        completionTime: p.completionTime!,
        isOnTime: p.isOnTime!,
        dueDate: p.dueDate,
        createdAt: p.createdAt
      }));
      const metrics = calculatePerformanceMetrics(metricsData);
      
      // Agrupar por proyecto para análisis
      interface ProjectAnalysis {
        project: any; // Project puede ser ObjectId o populated object
        tasks: IUserPerformance[];
        completedTasks: number;
        averageTime: number;
      }
      
      const projectAnalysis = performance.reduce((acc: Record<string, ProjectAnalysis>, p: IUserPerformance) => {
        const projectId = p.project._id.toString();
        if (!acc[projectId]) {
          acc[projectId] = {
            project: p.project,
            tasks: [],
            completedTasks: 0,
            averageTime: 0
          };
        }
        acc[projectId].tasks.push(p);
        if (p.isCompleted) {
          acc[projectId].completedTasks++;
        }
        return acc;
      }, {});
      
      // Calcular promedio por proyecto
      Object.values(projectAnalysis).forEach((project: any) => {
        const completed = project.tasks.filter((t: any) => t.isCompleted);
        if (completed.length > 0) {
          project.averageTime = completed.reduce((sum: number, t: any) => sum + t.completionTime, 0) / completed.length;
        }
      });
      
      // Obtener evaluaciones del usuario
      const evaluations = await UserEvaluation.find({
        user: userId
      }).sort({ createdAt: -1 }).populate('evaluatedBy', 'name');
      
      res.json({
        user,
        metrics: {
          ...metrics,
          totalTasks: performance.length,
          completedTasks: completedTasks.length,
          tasksInProgress: performance.filter(p => !p.isCompleted).length,
        },
        projectAnalysis: Object.values(projectAnalysis),
        evaluations,
        performanceHistory: performance.map(p => ({
          task: p.task,
          project: p.project,
          completionTime: p.completionTime,
          isCompleted: p.isCompleted,
          isOnTime: p.isOnTime,
          dueDate: p.dueDate,
          createdAt: p.createdAt,
          statusChanges: p.statusChanges
        }))
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al obtener métricas de usuario:', error);
      }
      res.status(500).json({ error: "Error al obtener métricas de usuario" });
    }
  };

  /**
   * Obtener predicciones de rendimiento para planificación
   */
  static getPerformancePredictions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      
      // Obtener historial de rendimiento de los últimos 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const performance = await UserPerformance.find({
        user: userId,
        isCompleted: true,
        createdAt: { $gte: sixMonthsAgo }
      }).sort({ createdAt: 1 });
      
      if (performance.length < 3) {
        res.json({
          message: "Datos insuficientes para realizar predicciones",
          minimumTasksRequired: 3,
          currentTasks: performance.length
        });
        return;
      }
      
      const metricsData = performance.map(p => ({
        completionTime: p.completionTime!,
        isOnTime: p.isOnTime!,
        dueDate: p.dueDate,
        createdAt: p.createdAt
      }));
      const metrics = calculatePerformanceMetrics(metricsData);
      
      // Análisis de tendencias por mes
      interface MonthlyTrend {
        tasks: IUserPerformance[];
        averageTime: number;
        onTimeRate: number;
      }
      
      const monthlyTrends = performance.reduce((acc: Record<string, MonthlyTrend>, p: IUserPerformance) => {
        const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            tasks: [],
            averageTime: 0,
            onTimeRate: 0
          };
        }
        acc[month].tasks.push(p);
        return acc;
      }, {});
      
      // Calcular métricas mensuales
      Object.entries(monthlyTrends).forEach(([month, data]: [string, any]) => {
        data.averageTime = data.tasks.reduce((sum: number, t: any) => sum + t.completionTime, 0) / data.tasks.length;
        data.onTimeRate = (data.tasks.filter((t: any) => t.isOnTime).length / data.tasks.length) * 100;
      });
      
      // Predicciones para próximos 3 meses
      const predictions = [];
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        predictions.push({
          period: futureDate.toISOString().substring(0, 7),
          estimatedCompletionTime: metrics.estimatedCompletionTime,
          expectedOnTimeRate: Math.min(metrics.onTimePercentage + (metrics.productivityTrend / 10), 100),
          recommendedTaskLoad: Math.round(20 / metrics.estimatedCompletionTime), // Basado en 20 días laborables por mes
          confidenceLevel: Math.min(performance.length * 10, 90) // Más datos = mayor confianza
        });
      }
      
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        currentMetrics: metrics,
        monthlyTrends,
        predictions,
        recommendations: {
          strengths: metrics.onTimePercentage > 80 ? ["Cumplimiento puntual de tareas"] : [],
          improvements: metrics.onTimePercentage < 70 ? ["Mejorar gestión del tiempo"] : [],
          optimalTaskLoad: Math.round(20 / metrics.estimatedCompletionTime)
        }
      });
    } catch (error) {
      console.error('Error al generar predicciones:', error);
      res.status(500).json({ error: "Error al generar predicciones" });
    }
  };

  /**
   * Crear evaluación de usuario (solo admin)
   */
  static createEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { period, metrics, score, comments, recommendations } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      
      const evaluation = new UserEvaluation({
        user: userId,
        evaluatedBy: req.user.id,
        period,
        metrics,
        score,
        comments,
        recommendations
      });
      
      await evaluation.save();
      await evaluation.populate('user', 'name email');
      await evaluation.populate('evaluatedBy', 'name');
      
      res.status(201).json({
        message: "Evaluación creada exitosamente",
        evaluation
      });
    } catch (error) {
      console.error('Error al crear evaluación:', error);
      res.status(500).json({ error: "Error al crear evaluación" });
    }
  };

  /**
   * Obtener evaluaciones de un usuario
   */
  static getUserEvaluations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      // Si no es admin, solo puede ver sus propias evaluaciones
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        res.status(403).json({ error: "No autorizado para ver estas evaluaciones" });
        return;
      }
      
      const evaluations = await UserEvaluation.find({
        user: userId
      }).sort({ createdAt: -1 }).populate('evaluatedBy', 'name');
      
      res.json(evaluations);
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      res.status(500).json({ error: "Error al obtener evaluaciones" });
    }
  };

  /**
   * Obtener resumen de performance para el dashboard del usuario
   */
  static getUserDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      
      // Obtener performance del último mes
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const performance = await UserPerformance.find({
        user: userId,
        createdAt: { $gte: lastMonth }
      }).populate('task', 'name').populate('project', 'projectName');
      
      const completedTasks = performance.filter(p => p.isCompleted && p.completionTime != null);
      const metricsData = completedTasks.map(p => ({
        completionTime: p.completionTime!,
        isOnTime: p.isOnTime!,
        dueDate: p.dueDate,
        createdAt: p.createdAt
      }));
      const metrics = calculatePerformanceMetrics(metricsData);
      
      // Obtener última evaluación
      const latestEvaluation = await UserEvaluation.findOne({
        user: userId
      }).sort({ createdAt: -1 }).populate('evaluatedBy', 'name');
      
      res.json({
        currentPeriodMetrics: {
          totalTasks: performance.length,
          completedTasks: completedTasks.length,
          onTimePercentage: metrics.onTimePercentage,
          averageCompletionTime: metrics.averageCompletionTime
        },
        latestEvaluation: latestEvaluation ? {
          score: latestEvaluation.score,
          comments: latestEvaluation.comments,
          date: latestEvaluation.createdAt,
          evaluatedBy: latestEvaluation.evaluatedBy
        } : null,
        recentTasks: performance.slice(0, 5)
          .filter(p => p.task && p.project) // Filtrar referencias nulas
          .map(p => ({
            task: p.task,
            project: p.project,
            isCompleted: p.isCompleted,
            isOnTime: p.isOnTime,
            completionTime: p.completionTime
          }))
      });
    } catch (error) {
      console.error('Error al obtener dashboard de usuario:', error);
      res.status(500).json({ error: "Error al obtener dashboard de usuario" });
    }
  };

  /**
   * Generar evaluación automatizada objetiva (sin intervención humana)
   */
  static generateAutomatedEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { period = 30 } = req.query;
      const periodDays = parseInt(period as string);
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      // Obtener datos de performance del período
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      const performance = await UserPerformance.find({
        user: userId,
        createdAt: { $gte: startDate }
      }).lean();

      // Calcular métricas automatizadas
      const automatedMetrics = calculateAutomatedMetrics(performance, periodDays);
      const evaluation = evaluatePerformanceAutomatically(automatedMetrics);

      // Generar reportes mensuales de los últimos 3 meses
      const currentDate = new Date();
      const monthlyReports = [];
      
      for (let i = 0; i < 3; i++) {
        const reportDate = new Date(currentDate);
        reportDate.setMonth(reportDate.getMonth() - i);
        
        const report = generateMonthlyReport(
          performance, 
          reportDate.getMonth() + 1, 
          reportDate.getFullYear()
        );
        monthlyReports.push(report);
      }

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        evaluationPeriod: {
          days: periodDays,
          startDate,
          endDate: new Date()
        },
        automatedMetrics,
        evaluation,
        monthlyReports,
        generatedAt: new Date(),
        isAutomated: true
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al generar evaluación automatizada:', error);
      }
      res.status(500).json({ error: "Error al generar evaluación automatizada" });
    }
  };
}

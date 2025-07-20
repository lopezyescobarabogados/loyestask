import type { Request, Response } from "express";
import Task from "../models/Task";
import UserPerformance from "../models/UserPerformance";
import { calculateWorkingDaysFromStart, calculateWorkingDays } from "../utils/workingDays";

export class TaskController {
    static createTask = async (req: Request, res: Response) => {
        try {
            const task = new Task(req.body);
            task.project = req.project.id;
            
            // Asegurar que la fecha se guarde correctamente
            if (req.body.dueDate) {
                const dueDate = new Date(req.body.dueDate);
                // Ajustar a medianoche UTC para evitar problemas de zona horaria
                task.dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            }
            
            req.project.tasks.push(task.id);
            await Promise.allSettled([task.save(), req.project.save()]);
            res.send("Tarea creada correctamente");
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        } 
    };

    static getProjectTasks = async (req: Request, res: Response) => {
        try {
            const tasks = await Task.find({ project: req.project.id }).populate(
                "project"
            );
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        }
    };

    static getTaskById = async (req: Request, res: Response) => {
        try {
            const task = await Task.findById(req.task.id).populate({path: 'completedBy.user', select: 'id name email'}).populate({path: 'notes', populate:{path: 'createdBy', select: 'id name email'}})
            res.json(task);
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        }
    };

    static updateTask = async (req: Request, res: Response) => {
        try {
            req.task.name = req.body.name
            req.task.description = req.body.description
            
            // Asegurar que la fecha se actualice correctamente
            if (req.body.dueDate) {
                const dueDate = new Date(req.body.dueDate);
                // Ajustar a medianoche UTC para evitar problemas de zona horaria
                req.task.dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            }
            
            await req.task.save()
            res.send("Tarea Actualizada Correctamente");
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        }
    };

    static deleteTask = async (req: Request, res: Response) => {
        try {
            req.project.tasks = req.project.tasks.filter(
                (task) => task.toString() !== req.task.id.toString()
            );
            await Promise.allSettled([req.task.deleteOne(), req.project.save()]);
            res.send("Tarea Eliminada Correctamente");
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        }
    };

    static updateStatus = async (req: Request, res: Response) => {
        try {
            const { status } = req.body
            const previousStatus = req.task.status
            
            req.task.status = status
            const data = {
                user: req.user.id,
                status
            }
            req.task.completedBy.push(data)
            
            // Registrar métricas de desempeño
            await TaskController.trackUserPerformance(
                req.user.id,
                req.task.id,
                req.task.project.toString(),
                status,
                previousStatus,
                req.task.dueDate,
                req.task.createdAt
            );
            
            await req.task.save()
            res.send("Tarea Actualizada")
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: "Hubo un error" });
        }
    }

    /**
     * Método privado para registrar métricas de desempeño
     */
    private static async trackUserPerformance(
        userId: string,
        taskId: string,
        projectId: string,
        newStatus: string,
        previousStatus: string,
        dueDate: Date,
        taskCreatedAt: Date
    ) {
        try {
            // Buscar registro existente de performance para esta tarea y usuario
            let performance = await UserPerformance.findOne({
                user: userId,
                task: taskId
            });

            const workingDaysFromStart = calculateWorkingDaysFromStart(taskCreatedAt);

            if (!performance) {
                // Crear nuevo registro de performance
                performance = new UserPerformance({
                    user: userId,
                    task: taskId,
                    project: projectId,
                    statusChanges: [{
                        status: newStatus,
                        timestamp: new Date(),
                        workingDaysFromStart
                    }],
                    dueDate,
                    isCompleted: newStatus === 'completed',
                    isOnTime: null
                });
            } else {
                // Actualizar registro existente
                performance.statusChanges.push({
                    status: newStatus,
                    timestamp: new Date(),
                    workingDaysFromStart
                });
            }

            // Si la tarea se completa, calcular métricas finales
            if (newStatus === 'completed' && !performance.isCompleted) {
                performance.isCompleted = true;
                performance.completionTime = workingDaysFromStart;
                
                // Calcular si se completó a tiempo (considerando días laborables)
                const dueDateWorkingDays = calculateWorkingDays(taskCreatedAt, dueDate);
                performance.isOnTime = workingDaysFromStart <= dueDateWorkingDays;
            }

            await performance.save();
        } catch (error) {
            console.error('Error al registrar métricas de desempeño:', error);
            // No fallar la actualización de la tarea por errores en métricas
        }
    }

}

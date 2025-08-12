import type { Request, Response } from "express";
import Task from "../models/Task";
import User from "../models/User";
import UserPerformance from "../models/UserPerformance";
import { calculateWorkingDaysFromStart, calculateWorkingDays } from "../utils/workingDays";
import { NotificationService } from "../services/NotificationService";

export class TaskController {
    /**
     * Asignar colaborador a una tarea si pertenece al proyecto
     */
    static addCollaborator = async (req: Request, res: Response) => {
        try {
            const { userId } = req.body;

            console.log('🔧 AddCollaborator - Request data:', {
                userId,
                projectId: req.project.id,
                taskId: req.task.id,
                requestBody: req.body
            });

            if (!userId) {
                return res.status(400).json({ error: 'userId es requerido' });
            }

            // Verificar que userId sea un string válido
            if (typeof userId !== 'string' || userId.trim() === '') {
                return res.status(400).json({ error: 'userId debe ser un ID válido' });
            }

            // Normalizar arrays de IDs del proyecto (team + manager)
            const teamIds = (req.project.team as any[]).map(member =>
                typeof member === 'string' ? member : member._id?.toString() || member.toString()
            );
            const managerId = typeof req.project.manager === 'string'
                ? req.project.manager
                : req.project.manager?._id?.toString() || req.project.manager?.toString();

            const allowedIds = new Set<string>([...teamIds, managerId]);

            console.log('🔧 AddCollaborator - Validation data:', {
                userId,
                teamIds,
                managerId,
                allowedIds: Array.from(allowedIds),
                isAllowed: allowedIds.has(userId)
            });

            if (!allowedIds.has(userId)) {
                return res.status(400).json({ error: 'El usuario no pertenece al proyecto' });
            }

            // Inicializar array si no existe (retrocompatibilidad)
            if (!Array.isArray(req.task.collaborators)) {
                (req.task as any).collaborators = [];
            }

            const alreadyAssigned = (req.task.collaborators as any[]).some(c => c.toString() === userId);
            if (alreadyAssigned) {
                return res.status(409).json({ error: 'El usuario ya está asignado a la tarea' });
            }

            (req.task.collaborators as any[]).push(userId);
            await req.task.save();

            console.log('✅ AddCollaborator - Success:', {
                taskId: req.task.id,
                newCollaborator: userId,
                totalCollaborators: req.task.collaborators.length
            });

            // Notificar asignación individual
            try {
                const notificationService = NotificationService.getInstance();
                await notificationService.notifyTaskAssignment({
                    taskId: req.task.id,
                    assignedUsers: [userId],
                    projectId: req.project.id,
                    assignedBy: { id: req.user.id, name: req.user.name },
                    dueDate: req.task.dueDate
                });
            } catch (notifyError) {
                console.error('Error al notificar asignación de colaborador:', notifyError);
            }

            res.json({ message: 'Colaborador asignado correctamente' });
        } catch (error) {
            console.error('❌ AddCollaborator - Error:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    /**
     * Eliminar colaborador de una tarea (solo si actualmente está asignado)
     */
    static removeCollaborator = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            if (!Array.isArray(req.task.collaborators) ||
                !(req.task.collaborators as any[]).some(c => c.toString() === userId)) {
                return res.status(404).json({ error: 'El usuario no está asignado a la tarea' });
            }

            (req.task as any).collaborators = (req.task.collaborators as any[])
                .filter(c => c.toString() !== userId);
            await req.task.save();

            res.json({ message: 'Colaborador eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar colaborador:', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    /**
     * Listar usuarios del proyecto que aún no están asignados como colaboradores en la tarea
     */
    static getAvailableCollaborators = async (req: Request, res: Response) => {
        try {
            // Obtener IDs del proyecto (team + manager)
            const teamIds = (req.project.team as any[]).map(member =>
                typeof member === 'string' ? member : member._id?.toString() || member.toString()
            );
            const managerId = typeof req.project.manager === 'string'
                ? req.project.manager
                : req.project.manager?._id?.toString() || req.project.manager?.toString();
            const projectUserIds = Array.from(new Set<string>([...teamIds, managerId].filter(Boolean)));

            // IDs ya asignados a la tarea
            const collaboratorIds = (req.task.collaborators || []).map(c => c.toString());

            // Filtrar los que no están en colaboradores
            const remainingIds = projectUserIds.filter(id => !collaboratorIds.includes(id));

            if (remainingIds.length === 0) {
                return res.json([]);
            }

            const users = await User.find({ _id: { $in: remainingIds } }, 'name email');
            res.json(users.map(u => ({ _id: u._id.toString(), name: u.name, email: u.email, isManager: u._id.toString() === managerId })));
        } catch (error) {
            console.error('Error al obtener colaboradores disponibles:', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
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
            
            // Enviar notificaciones de asignación si hay usuarios asignados
            try {
                const notificationService = NotificationService.getInstance();
                
                // Obtener IDs de team y manager
                const teamIds = (req.project.team as any[]).map(member => 
                    typeof member === 'string' ? member : member._id?.toString() || member.toString()
                );
                const managerId = typeof req.project.manager === 'string' 
                    ? req.project.manager 
                    : req.project.manager._id?.toString() || req.project.manager.toString();
                
                const allAssignedUsers = [...teamIds, managerId];
                
                await notificationService.notifyTaskAssignment({
                    taskId: task.id,
                    assignedUsers: allAssignedUsers,
                    projectId: req.project.id,
                    assignedBy: { id: req.user.id, name: req.user.name },
                    dueDate: task.dueDate
                });
            } catch (notificationError) {
                console.error('Error al enviar notificaciones de asignación:', notificationError);
                // No fallar la creación de tarea por error de notificación
            }
            
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
            const task = await Task.findById(req.task.id)
                .populate({path: 'completedBy.user', select: 'id name email'})
                .populate({path: 'notes', populate:{path: 'createdBy', select: 'id name email'}})
                .populate('archive.uploadedBy', 'id name email')
                .populate('collaborators', 'id name email');
            res.json(task);
        } catch (error) {
            res.status(500).json({ error: "Hubo un error" });
        }
    };

    static updateTask = async (req: Request, res: Response) => {
        try {
            const previousDueDate = req.task.dueDate;
            
            req.task.name = req.body.name
            req.task.description = req.body.description
            
            // Asegurar que la fecha se actualice correctamente
            if (req.body.dueDate) {
                const dueDate = new Date(req.body.dueDate);
                // Ajustar a medianoche UTC para evitar problemas de zona horaria
                req.task.dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            }
            
            await req.task.save();
            
            // Si la fecha de entrega cambió, actualizar registros de performance
            if (req.body.dueDate && req.task.dueDate.getTime() !== previousDueDate.getTime()) {
                await TaskController.updatePerformanceDueDate(req.task.id, req.task.dueDate, req.task.createdAt);
            }
            
            res.send("Tarea Actualizada Correctamente");
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
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
            
            // Enviar notificaciones de cambio de estado
            try {
                const notificationService = NotificationService.getInstance();
                await notificationService.notifyStatusChange({
                    taskId: req.task.id,
                    newStatus: status,
                    previousStatus: previousStatus,
                    changedBy: { id: req.user.id, name: req.user.name },
                    projectId: req.task.project.toString()
                });
            } catch (notificationError) {
                console.error('Error al enviar notificaciones de cambio de estado:', notificationError);
                // No fallar la actualización por error de notificación
            }
            
            res.send("Tarea Actualizada")
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: "Hubo un error" });
        }
    }

    /**
     * Método privado para registrar métricas de desempeño
     */
    /**
     * Actualiza la fecha de entrega en los registros de performance y recalcula isOnTime
     */
    private static async updatePerformanceDueDate(taskId: string, newDueDate: Date, taskCreatedAt: Date) {
        try {
            // Buscar todos los registros de performance para esta tarea
            const performanceRecords = await UserPerformance.find({ task: taskId });
            
            for (const performance of performanceRecords) {
                // Actualizar la fecha de entrega
                performance.dueDate = newDueDate;
                
                // Si la tarea ya está completada, recalcular isOnTime con la nueva fecha
                if (performance.isCompleted && performance.completionTime !== null) {
                    const dueDateWorkingDays = calculateWorkingDays(taskCreatedAt, newDueDate);
                    performance.isOnTime = performance.completionTime <= dueDateWorkingDays;
                }
                
                await performance.save();
            }
            
            console.log(`✅ Actualizados ${performanceRecords.length} registros de performance para la tarea ${taskId}`);
        } catch (error) {
            console.error('❌ Error al actualizar fechas de entrega en performance:', error);
            // No fallar la actualización de la tarea por errores en performance
        }
    }

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
                    isOnTime: null // Se calculará al completar
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
            
            // Validar y recalcular isOnTime si está null pero la tarea está completada
            if (performance.isCompleted && performance.isOnTime === null && performance.completionTime !== null) {
                const dueDateWorkingDays = calculateWorkingDays(taskCreatedAt, dueDate);
                performance.isOnTime = performance.completionTime <= dueDateWorkingDays;
            }

            await performance.save();
        } catch (error) {
            // Error silencioso para no afectar el flujo principal
            // Solo registrar en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.error('Error al registrar métricas de desempeño:', error);
            }
        }
    }

}

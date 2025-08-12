/**
 * Tests para verificar la actualización correcta de fechas de entrega en performance
 */

import mongoose from 'mongoose';
import Task from '../models/Task';
import UserPerformance from '../models/UserPerformance';
import User from '../models/User';
import Project from '../models/Project';
import { TaskController } from '../controllers/TaskController';
import { calculateWorkingDays } from '../utils/workingDays';

// Mock del middleware de autenticación
jest.mock('../middleware/auth');
jest.mock('../services/NotificationService');

describe('TaskController - Performance Due Date Updates', () => {
    let user: any;
    let project: any;
    let task: any;
    
    beforeAll(async () => {
        // Conectar a la base de datos de test
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/loyestask_test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Limpiar la base de datos
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await UserPerformance.deleteMany({});

        // Crear datos de prueba
        user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            confirmed: true
        });
        await user.save();

        project = new Project({
            projectName: 'Test Project',
            clientName: 'Test Client',
            description: 'Test Description',
            manager: user._id,
            team: [user._id],
            tasks: []
        });
        await project.save();

        const originalDueDate = new Date('2025-01-15');
        task = new Task({
            name: 'Test Task',
            description: 'Test Description',
            project: project._id,
            dueDate: originalDueDate,
            status: 'pending'
        });
        await task.save();

        project.tasks.push(task._id);
        await project.save();
    });

    afterEach(async () => {
        // Limpiar después de cada test
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await UserPerformance.deleteMany({});
    });

    describe('updateTask with due date changes', () => {
        it('should update performance records when task due date changes', async () => {
            // Crear un registro de performance inicial
            const performance = new UserPerformance({
                user: user._id,
                task: task._id,
                project: project._id,
                statusChanges: [{
                    status: 'inProgress',
                    timestamp: new Date(),
                    workingDaysFromStart: 5
                }],
                dueDate: task.dueDate,
                isCompleted: false,
                isOnTime: null
            });
            await performance.save();

            // Simular una solicitud de actualización con nueva fecha
            const newDueDate = new Date('2025-01-25');
            const req = {
                task,
                body: {
                    name: 'Test Task Updated',
                    description: 'Test Description Updated',
                    dueDate: newDueDate.toISOString()
                }
            } as any;

            const res = {
                send: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            // Ejecutar la actualización
            await TaskController.updateTask(req, res);

            // Verificar que la tarea se actualizó
            expect(res.send).toHaveBeenCalledWith('Tarea Actualizada Correctamente');

            // Verificar que el registro de performance se actualizó
            const updatedPerformance = await UserPerformance.findOne({
                user: user._id,
                task: task._id
            });

            expect(updatedPerformance).toBeTruthy();
            expect(updatedPerformance!.dueDate.toISOString().split('T')[0]).toBe('2025-01-25');
        });

        it('should recalculate isOnTime for completed tasks when due date changes', async () => {
            // Crear una tarea completada con performance
            const completionTime = 10; // días laborables para completar
            const performance = new UserPerformance({
                user: user._id,
                task: task._id,
                project: project._id,
                statusChanges: [
                    {
                        status: 'inProgress',
                        timestamp: new Date('2025-01-01'),
                        workingDaysFromStart: 1
                    },
                    {
                        status: 'completed',
                        timestamp: new Date('2025-01-15'),
                        workingDaysFromStart: completionTime
                    }
                ],
                dueDate: task.dueDate, // Fecha original: 2025-01-15
                isCompleted: true,
                completionTime,
                isOnTime: true // Originalmente a tiempo
            });
            await performance.save();

            // Cambiar la fecha de entrega a una fecha más temprana
            const newDueDate = new Date('2025-01-10'); // Fecha más temprana
            const req = {
                task,
                body: {
                    name: task.name,
                    description: task.description,
                    dueDate: newDueDate.toISOString()
                }
            } as any;

            const res = {
                send: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            // Ejecutar la actualización
            await TaskController.updateTask(req, res);

            // Verificar que el performance se recalculó
            const updatedPerformance = await UserPerformance.findOne({
                user: user._id,
                task: task._id
            });

            expect(updatedPerformance).toBeTruthy();
            expect(updatedPerformance!.dueDate.toISOString().split('T')[0]).toBe('2025-01-10');
            
            // Calcular los días laborables permitidos con la nueva fecha
            const allowedWorkingDays = calculateWorkingDays(task.createdAt, newDueDate);
            const shouldBeOnTime = completionTime <= allowedWorkingDays;
            
            expect(updatedPerformance!.isOnTime).toBe(shouldBeOnTime);
        });

        it('should handle multiple performance records for the same task', async () => {
            // Crear múltiples registros de performance para la misma tarea (diferentes usuarios)
            const user2 = new User({
                name: 'Test User 2',
                email: 'test2@example.com',
                password: 'password123',
                confirmed: true
            });
            await user2.save();

            const performance1 = new UserPerformance({
                user: user._id,
                task: task._id,
                project: project._id,
                statusChanges: [{
                    status: 'completed',
                    timestamp: new Date(),
                    workingDaysFromStart: 8
                }],
                dueDate: task.dueDate,
                isCompleted: true,
                completionTime: 8,
                isOnTime: true
            });

            const performance2 = new UserPerformance({
                user: user2._id,
                task: task._id,
                project: project._id,
                statusChanges: [{
                    status: 'inProgress',
                    timestamp: new Date(),
                    workingDaysFromStart: 5
                }],
                dueDate: task.dueDate,
                isCompleted: false,
                isOnTime: null
            });

            await Promise.all([performance1.save(), performance2.save()]);

            // Actualizar la fecha de entrega
            const newDueDate = new Date('2025-01-25');
            const req = {
                task,
                body: {
                    name: task.name,
                    description: task.description,
                    dueDate: newDueDate.toISOString()
                }
            } as any;

            const res = {
                send: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            await TaskController.updateTask(req, res);

            // Verificar que ambos registros se actualizaron
            const updatedPerformances = await UserPerformance.find({ task: task._id });
            
            expect(updatedPerformances).toHaveLength(2);
            updatedPerformances.forEach(perf => {
                expect(perf.dueDate.toISOString().split('T')[0]).toBe('2025-01-25');
            });
        });

        it('should not update performance records when due date does not change', async () => {
            // Crear un registro de performance
            const performance = new UserPerformance({
                user: user._id,
                task: task._id,
                project: project._id,
                statusChanges: [{
                    status: 'inProgress',
                    timestamp: new Date(),
                    workingDaysFromStart: 5
                }],
                dueDate: task.dueDate,
                isCompleted: false,
                isOnTime: null
            });
            await performance.save();

            const originalUpdatedAt = performance.updatedAt;

            // Actualizar la tarea sin cambiar la fecha
            const req = {
                task,
                body: {
                    name: 'Updated Name',
                    description: 'Updated Description'
                    // No se incluye dueDate
                }
            } as any;

            const res = {
                send: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            // Esperar un poco para detectar cambios en updatedAt
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await TaskController.updateTask(req, res);

            // Verificar que el performance no se modificó
            const unchangedPerformance = await UserPerformance.findOne({
                user: user._id,
                task: task._id
            });

            expect(unchangedPerformance).toBeTruthy();
            expect(unchangedPerformance!.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
        });
    });
});

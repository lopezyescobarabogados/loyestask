import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../server';
import { connectDB } from '../config/db';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import { generateJWT } from '../utils/jwt';

// Configuración de test
let authToken: string;
let projectId: string;
let taskId: string;
let userId: string;

beforeEach(async () => {
    // Conectar a la base de datos de test
    await connectDB();
    
    // Crear usuario de test
    const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmed: true,
        role: 'user'
    });
    await user.save();
    userId = user.id;
    
    // Generar token
    authToken = generateJWT({ id: user.id });
    
    // Crear proyecto de test
    const project = new Project({
        projectName: 'Test Project',
        clientName: 'Test Client',
        description: 'Test Description',
        manager: user.id,
        team: [user.id]
    });
    await project.save();
    projectId = project.id;
    
    // Crear tarea de test
    const task = new Task({
        name: 'Test Task',
        description: 'Test Description',
        project: project.id,
        dueDate: new Date()
    });
    await task.save();
    taskId = task.id;
    
    // Agregar tarea al proyecto
    project.tasks.push(task.id);
    await project.save();
});

afterEach(async () => {
    // Limpiar base de datos
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    
    // Limpiar archivos de test
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'tasks', taskId);
        await fs.rmdir(uploadsDir, { recursive: true });
    } catch (error) {
        // No problem if directory doesn't exist
    }
});

describe('File Management System', () => {
    
    describe('POST /api/projects/:projectId/tasks/:taskId/files', () => {
        test('should upload files successfully', async () => {
            const testFilePath = path.join(__dirname, 'fixtures', 'test.txt');
            
            // Crear archivo de test
            await fs.mkdir(path.dirname(testFilePath), { recursive: true });
            await fs.writeFile(testFilePath, 'This is a test file');
            
            const response = await request(app)
                .post(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', testFilePath);
            
            expect(response.status).toBe(201);
            expect(response.body.message).toContain('archivo(s) subido(s) correctamente');
            expect(response.body.files).toHaveLength(1);
            expect(response.body.files[0]).toHaveProperty('id');
            expect(response.body.files[0].originalName).toBe('test.txt');
            
            // Limpiar
            await fs.unlink(testFilePath);
        });
        
        test('should reject files with invalid types', async () => {
            const testFilePath = path.join(__dirname, 'fixtures', 'test.exe');
            
            // Crear archivo de test con extensión no permitida
            await fs.mkdir(path.dirname(testFilePath), { recursive: true });
            await fs.writeFile(testFilePath, 'This is an executable file');
            
            const response = await request(app)
                .post(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', testFilePath);
            
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Tipo de archivo no permitido');
            
            // Limpiar
            await fs.unlink(testFilePath);
        });
        
        test('should reject files that exceed size limit', async () => {
            const testFilePath = path.join(__dirname, 'fixtures', 'large.txt');
            
            // Crear archivo grande (más de 50MB)
            await fs.mkdir(path.dirname(testFilePath), { recursive: true });
            const largeContent = 'A'.repeat(51 * 1024 * 1024); // 51MB
            await fs.writeFile(testFilePath, largeContent);
            
            const response = await request(app)
                .post(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', testFilePath);
            
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('demasiado grande');
            
            // Limpiar
            await fs.unlink(testFilePath);
        });
    });
    
    describe('GET /api/projects/:projectId/tasks/:taskId/files', () => {
        test('should return empty files list for new task', async () => {
            const response = await request(app)
                .get(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.files).toHaveLength(0);
            expect(response.body.totalFiles).toBe(0);
            expect(response.body.totalSize).toBe(0);
        });
    });
    
    describe('DELETE /api/projects/:projectId/tasks/:taskId/files/:fileId', () => {
        test('should delete file successfully', async () => {
            // Primero subir un archivo
            const testFilePath = path.join(__dirname, 'fixtures', 'delete-test.txt');
            await fs.mkdir(path.dirname(testFilePath), { recursive: true });
            await fs.writeFile(testFilePath, 'This file will be deleted');
            
            const uploadResponse = await request(app)
                .post(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', testFilePath);
            
            const fileId = uploadResponse.body.files[0].id;
            
            // Luego eliminar el archivo
            const deleteResponse = await request(app)
                .delete(`/api/projects/${projectId}/tasks/${taskId}/files/${fileId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.message).toBe('Archivo eliminado correctamente');
            
            // Verificar que el archivo ya no existe
            const getResponse = await request(app)
                .get(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(getResponse.body.files).toHaveLength(0);
            
            // Limpiar
            await fs.unlink(testFilePath);
        });
        
        test('should return 404 for non-existent file', async () => {
            const fakeFileId = '507f1f77bcf86cd799439011';
            
            const response = await request(app)
                .delete(`/api/projects/${projectId}/tasks/${taskId}/files/${fakeFileId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Archivo no encontrado');
        });
    });
    
    describe('GET /api/projects/:projectId/tasks/:taskId/files/stats', () => {
        test('should return file statistics', async () => {
            const response = await request(app)
                .get(`/api/projects/${projectId}/tasks/${taskId}/files/stats`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalFiles');
            expect(response.body).toHaveProperty('totalSize');
            expect(response.body).toHaveProperty('limits');
            expect(response.body).toHaveProperty('usage');
            expect(response.body.limits.maxFiles).toBe(20);
        });
    });
    
    describe('Authorization', () => {
        test('should require authentication', async () => {
            const response = await request(app)
                .get(`/api/projects/${projectId}/tasks/${taskId}/files`);
            
            expect(response.status).toBe(401);
        });
        
        test('should require task access', async () => {
            // Crear otro usuario
            const otherUser = new User({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                confirmed: true,
                role: 'user'
            });
            await otherUser.save();
            
            const otherToken = generateJWT({ id: otherUser.id });
            
            const response = await request(app)
                .get(`/api/projects/${projectId}/tasks/${taskId}/files`)
                .set('Authorization', `Bearer ${otherToken}`);
            
            expect(response.status).toBe(403);
        });
    });
});

describe('FileService', () => {
    const { FileService } = require('../services/FileService');
    
    describe('validateFileUpload', () => {
        test('should allow upload when under limits', () => {
            const currentFiles = [
                { fileSize: 1024 * 1024 }, // 1MB
                { fileSize: 2 * 1024 * 1024 }, // 2MB
            ];
            const newFileSize = 3 * 1024 * 1024; // 3MB
            
            const result = FileService.validateFileUpload(currentFiles, newFileSize);
            expect(result.valid).toBe(true);
        });
        
        test('should reject when file count limit exceeded', () => {
            const currentFiles = Array(20).fill({ fileSize: 1024 }); // 20 files
            const newFileSize = 1024;
            
            const result = FileService.validateFileUpload(currentFiles, newFileSize);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Máximo 20 archivos');
        });
        
        test('should reject when total size limit exceeded', () => {
            const currentFiles = [
                { fileSize: 150 * 1024 * 1024 }, // 150MB
            ];
            const newFileSize = 60 * 1024 * 1024; // 60MB
            
            const result = FileService.validateFileUpload(currentFiles, newFileSize);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Tamaño total máximo excedido');
        });
    });
    
    describe('calculateTotalSize', () => {
        test('should calculate total size correctly', () => {
            const files = [
                { fileSize: 1024 },
                { fileSize: 2048 },
                { fileSize: 512 },
            ];
            
            const total = FileService.calculateTotalSize(files);
            expect(total).toBe(3584);
        });
        
        test('should return 0 for empty array', () => {
            const total = FileService.calculateTotalSize([]);
            expect(total).toBe(0);
        });
    });
    
    describe('sanitizeFileName', () => {
        test('should sanitize special characters', () => {
            const result = FileService.sanitizeFileName('file name with spaces & symbols!.txt');
            expect(result).toBe('file_name_with_spaces___symbols_.txt');
        });
        
        test('should limit length', () => {
            const longName = 'a'.repeat(150) + '.txt';
            const result = FileService.sanitizeFileName(longName);
            expect(result.length).toBeLessThanOrEqual(100);
        });
    });
});

import type { Request, Response } from "express";
import Task from "../models/Task";
import { FileService } from "../services/FileService";
import path from "path";
import fs from "fs/promises";

interface FileUploadRequest extends Request {
    files?: Express.Multer.File[];
}

export class FileController {
    /**
     * Subir archivos a una tarea
     */
    static uploadFiles = async (req: FileUploadRequest, res: Response): Promise<void> => {
        try {
            const taskId = req.task.id;
            const files = req.files as Express.Multer.File[];
            
            if (!files || files.length === 0) {
                res.status(400).json({ error: 'No se han proporcionado archivos' });
                return;
            }
            
            // Validar límites antes de procesar
            const validation = FileService.validateFileUpload(
                req.task.archive,
                files.reduce((total, file) => total + file.size, 0)
            );
            
            if (!validation.valid) {
                // Eliminar archivos subidos si la validación falla
                for (const file of files) {
                    await FileService.deleteFile(file.path);
                }
                res.status(400).json({ error: validation.error });
                return;
            }
            
            // Procesar archivos
            const uploadedFiles = files.map(file => ({
                fileName: file.filename,
                originalName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: req.user.id,
                uploadedAt: new Date(),
            }));
            
            // Agregar archivos a la tarea
            req.task.archive.push(...uploadedFiles);
            await req.task.save();
            
            // Obtener la tarea actualizada para obtener los IDs generados
            const updatedTask = await Task.findById(req.task.id);
            const newArchiveFiles = updatedTask!.archive.slice(-uploadedFiles.length);
            
            // Respuesta con información de los archivos subidos
            const responseFiles = newArchiveFiles.map((file: any) => ({
                id: file._id,
                fileName: file.fileName,
                originalName: file.originalName,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                uploadedBy: {
                    id: req.user.id,
                    name: req.user.name,
                },
                uploadedAt: file.uploadedAt,
            }));
            
            res.status(201).json({
                message: `${files.length} archivo(s) subido(s) correctamente`,
                files: responseFiles,
                totalFiles: req.task.archive.length,
                totalSize: FileService.calculateTotalSize(req.task.archive),
            });
            
        } catch (error) {
            console.error('Error al subir archivos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    
    /**
     * Obtener lista de archivos de una tarea
     */
    static getTaskFiles = async (req: Request, res: Response): Promise<void> => {
        try {
            const task = await Task.findById(req.task.id)
                .populate('archive.uploadedBy', 'name email')
                .select('archive');
            
            if (!task) {
                res.status(404).json({ error: 'Tarea no encontrada' });
                return;
            }
            
            // Verificar que los archivos existen físicamente
            const filesWithStatus = await Promise.all(
                task.archive.map(async (file: any) => {
                    const fileInfo = await FileService.getFileInfo(file.filePath);
                    return {
                        id: file._id,
                        fileName: file.fileName,
                        originalName: file.originalName,
                        fileSize: file.fileSize,
                        mimeType: file.mimeType,
                        uploadedBy: file.uploadedBy,
                        uploadedAt: file.uploadedAt,
                        exists: fileInfo.exists,
                        actualSize: fileInfo.size,
                    };
                })
            );
            
            res.json({
                files: filesWithStatus,
                totalFiles: filesWithStatus.length,
                totalSize: FileService.calculateTotalSize(task.archive),
                limits: {
                    maxFiles: FileService.validateFileUpload(task.archive, 0),
                    maxTotalSize: Math.round((200 * 1024 * 1024) / (1024 * 1024)), // 200MB en MB
                },
            });
            
        } catch (error) {
            console.error('Error al obtener archivos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    
    /**
     * Descargar un archivo específico
     */
    static downloadFile = async (req: Request, res: Response): Promise<void> => {
        try {
            const { fileId } = req.params;
            const task = req.task;
            
            // Buscar el archivo en la tarea
            const file = task.archive.find((f: any) => f._id.toString() === fileId);
            
            if (!file) {
                res.status(404).json({ error: 'Archivo no encontrado' });
                return;
            }
            
            // Verificar que el archivo existe físicamente
            const fileInfo = await FileService.getFileInfo(file.filePath);
            if (!fileInfo.exists) {
                res.status(404).json({ error: 'Archivo físico no encontrado' });
                return;
            }
            
            // Configurar headers para descarga
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Length', file.fileSize.toString());
            
            // Enviar archivo
            res.sendFile(path.resolve(file.filePath));
            
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    
    /**
     * Eliminar un archivo específico
     */
    static deleteFile = async (req: Request, res: Response): Promise<void> => {
        try {
            const { fileId } = req.params;
            const task = req.task;
            
            // Buscar el índice del archivo
            const fileIndex = task.archive.findIndex((f: any) => f._id.toString() === fileId);
            
            if (fileIndex === -1) {
                res.status(404).json({ error: 'Archivo no encontrado' });
                return;
            }
            
            const file = task.archive[fileIndex];
            
            // Verificar permisos: solo el usuario que subió el archivo o administradores pueden eliminarlo
            if (file.uploadedBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
                res.status(403).json({ error: 'No tienes permisos para eliminar este archivo' });
                return;
            }
            
            // Eliminar archivo físico
            const deleted = await FileService.deleteFile(file.filePath);
            if (!deleted) {
                console.warn(`No se pudo eliminar el archivo físico: ${file.filePath}`);
            }
            
            // Eliminar de la base de datos
            task.archive.splice(fileIndex, 1);
            await task.save();
            
            // Limpiar directorio si está vacío
            await FileService.cleanupTaskDirectory(task.id);
            
            res.json({
                message: 'Archivo eliminado correctamente',
                fileName: file.originalName,
                totalFiles: task.archive.length,
                totalSize: FileService.calculateTotalSize(task.archive),
            });
            
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    
    /**
     * Reemplazar un archivo existente
     */
    static replaceFile = async (req: FileUploadRequest, res: Response): Promise<void> => {
        try {
            const { fileId } = req.params;
            const files = req.files as Express.Multer.File[];
            const task = req.task;
            
            if (!files || files.length !== 1) {
                res.status(400).json({ error: 'Debe proporcionar exactamente un archivo para reemplazar' });
                return;
            }
            
            const newFile = files[0];
            
            // Buscar el archivo a reemplazar
            const fileIndex = task.archive.findIndex((f: any) => f._id.toString() === fileId);
            
            if (fileIndex === -1) {
                // Eliminar archivo subido si no se encuentra el original
                await FileService.deleteFile(newFile.path);
                res.status(404).json({ error: 'Archivo original no encontrado' });
                return;
            }
            
            const oldFile = task.archive[fileIndex];
            
            // Verificar permisos
            if (oldFile.uploadedBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
                await FileService.deleteFile(newFile.path);
                res.status(403).json({ error: 'No tienes permisos para reemplazar este archivo' });
                return;
            }
            
            // Validar límites (excluyendo el archivo actual)
            const otherFiles = task.archive.filter((_: any, index: number) => index !== fileIndex);
            const validation = FileService.validateFileUpload(otherFiles, newFile.size);
            
            if (!validation.valid) {
                await FileService.deleteFile(newFile.path);
                res.status(400).json({ error: validation.error });
                return;
            }
            
            // Eliminar archivo físico anterior
            await FileService.deleteFile(oldFile.filePath);
            
            // Actualizar información del archivo
            task.archive[fileIndex] = {
                ...oldFile,
                fileName: newFile.filename,
                originalName: newFile.originalname,
                filePath: newFile.path,
                fileSize: newFile.size,
                mimeType: newFile.mimetype,
                uploadedBy: req.user.id,
                uploadedAt: new Date(),
            };
            
            await task.save();
            
            res.json({
                message: 'Archivo reemplazado correctamente',
                file: {
                    id: (task.archive[fileIndex] as any)._id,
                    fileName: newFile.filename,
                    originalName: newFile.originalname,
                    fileSize: newFile.size,
                    mimeType: newFile.mimetype,
                    uploadedBy: {
                        id: req.user.id,
                        name: req.user.name,
                    },
                    uploadedAt: new Date(),
                },
                totalFiles: task.archive.length,
                totalSize: FileService.calculateTotalSize(task.archive),
            });
            
        } catch (error) {
            console.error('Error al reemplazar archivo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    
    /**
     * Obtener estadísticas de archivos de una tarea
     */
    static getFileStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const task = req.task;
            const files = task.archive;
            
            // Agrupar por tipo de archivo
            const typeStats = files.reduce((acc: any, file: any) => {
                const extension = path.extname(file.originalName).toLowerCase();
                if (!acc[extension]) {
                    acc[extension] = {
                        count: 0,
                        totalSize: 0,
                    };
                }
                acc[extension].count++;
                acc[extension].totalSize += file.fileSize;
                return acc;
            }, {});
            
            // Estadísticas generales
            const totalSize = FileService.calculateTotalSize(files);
            const averageSize = files.length > 0 ? Math.round(totalSize / files.length) : 0;
            
            res.json({
                totalFiles: files.length,
                totalSize,
                averageSize,
                typeBreakdown: typeStats,
                limits: {
                    maxFiles: 20,
                    maxTotalSize: 200 * 1024 * 1024, // 200MB
                    maxFileSize: 50 * 1024 * 1024,   // 50MB
                },
                usage: {
                    filePercentage: Math.round((files.length / 20) * 100),
                    sizePercentage: Math.round((totalSize / (200 * 1024 * 1024)) * 100),
                },
            });
            
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}

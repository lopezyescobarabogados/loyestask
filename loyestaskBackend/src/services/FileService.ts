import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Configuración de tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
    // Documentos
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    
    // Imágenes
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    
    // Archivos comprimidos
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/x-7z-compressed': '.7z',
    
    // Audio/Video
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'video/mp4': '.mp4',
    'video/avi': '.avi',
    'video/quicktime': '.mov',
    
    // Otros
    'application/json': '.json',
    'application/xml': '.xml',
};

// Configuración de límites
export const FILE_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB por archivo
    MAX_FILES_PER_TASK: 20,
    MAX_TOTAL_SIZE_PER_TASK: 200 * 1024 * 1024, // 200MB total por tarea
};

// Directorio base para uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const TASKS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'tasks');

// Crear directorios si no existen
export const ensureUploadsDirectory = async (): Promise<void> => {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
    
    try {
        await fs.access(TASKS_UPLOADS_DIR);
    } catch {
        await fs.mkdir(TASKS_UPLOADS_DIR, { recursive: true });
    }
};

// Configuración de storage de multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureUploadsDirectory();
            const taskId = req.params.taskId;
            const taskDir = path.join(TASKS_UPLOADS_DIR, taskId);
            
            try {
                await fs.access(taskDir);
            } catch {
                await fs.mkdir(taskDir, { recursive: true });
            }
            
            cb(null, taskDir);
        } catch (error) {
            cb(error as Error, '');
        }
    },
    filename: (req, file, cb) => {
        // Generar nombre único para evitar colisiones
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const fileExt = path.extname(file.originalname);
        const sanitizedOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 50);
        
        const uniqueFileName = `${timestamp}_${randomString}_${sanitizedOriginalName}`;
        cb(null, uniqueFileName);
    }
});

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Verificar tipo de archivo
    if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
        const error = new Error(
            `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
        ) as any;
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
    }
    
    cb(null, true);
};

// Configuración de multer
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_LIMITS.MAX_FILE_SIZE,
        files: FILE_LIMITS.MAX_FILES_PER_TASK,
    },
});

// Utilidades para manejo de archivos
export class FileService {
    /**
     * Obtener información de un archivo
     */
    static async getFileInfo(filePath: string): Promise<{
        exists: boolean;
        size?: number;
        mtime?: Date;
    }> {
        try {
            const stats = await fs.stat(filePath);
            return {
                exists: true,
                size: stats.size,
                mtime: stats.mtime,
            };
        } catch {
            return { exists: false };
        }
    }
    
    /**
     * Eliminar archivo del sistema de archivos
     */
    static async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error(`Error al eliminar archivo ${filePath}:`, error);
            return false;
        }
    }
    
    /**
     * Eliminar directorio de tarea si está vacío
     */
    static async cleanupTaskDirectory(taskId: string): Promise<void> {
        const taskDir = path.join(TASKS_UPLOADS_DIR, taskId);
        try {
            const files = await fs.readdir(taskDir);
            if (files.length === 0) {
                await fs.rmdir(taskDir);
            }
        } catch (error) {
            // Directorio no existe o no se puede eliminar, no es crítico
            console.log(`No se pudo limpiar directorio de tarea ${taskId}:`, error);
        }
    }
    
    /**
     * Calcular el tamaño total de archivos de una tarea
     */
    static calculateTotalSize(files: Array<{ fileSize: number }>): number {
        return files.reduce((total, file) => total + file.fileSize, 0);
    }
    
    /**
     * Validar que se puede agregar un nuevo archivo
     */
    static validateFileUpload(
        currentFiles: Array<{ fileSize: number }>,
        newFileSize: number
    ): { valid: boolean; error?: string } {
        // Verificar límite de archivos
        if (currentFiles.length >= FILE_LIMITS.MAX_FILES_PER_TASK) {
            return {
                valid: false,
                error: `Máximo ${FILE_LIMITS.MAX_FILES_PER_TASK} archivos por tarea`
            };
        }
        
        // Verificar límite de tamaño total
        const currentTotalSize = FileService.calculateTotalSize(currentFiles);
        const newTotalSize = currentTotalSize + newFileSize;
        
        if (newTotalSize > FILE_LIMITS.MAX_TOTAL_SIZE_PER_TASK) {
            const maxSizeMB = Math.round(FILE_LIMITS.MAX_TOTAL_SIZE_PER_TASK / (1024 * 1024));
            const currentSizeMB = Math.round(currentTotalSize / (1024 * 1024));
            
            return {
                valid: false,
                error: `Tamaño total máximo excedido. Máximo: ${maxSizeMB}MB, Actual: ${currentSizeMB}MB`
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Obtener la extensión de archivo basada en el mime type
     */
    static getFileExtension(mimeType: string): string {
        return ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || '.bin';
    }
    
    /**
     * Sanitizar nombre de archivo
     */
    static sanitizeFileName(fileName: string): string {
        return fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
    }
}

// Middleware de manejo de errores de multer
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                const maxSizeMB = Math.round(FILE_LIMITS.MAX_FILE_SIZE / (1024 * 1024));
                return res.status(400).json({
                    error: `Archivo demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
                });
                
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    error: `Demasiados archivos. Máximo: ${FILE_LIMITS.MAX_FILES_PER_TASK} archivos`
                });
                
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    error: 'Campo de archivo inesperado'
                });
                
            default:
                return res.status(400).json({
                    error: `Error en el upload: ${error.message}`
                });
        }
    }
    
    if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            error: error.message
        });
    }
    
    next(error);
};

export default {
    uploadMiddleware,
    FileService,
    handleMulterError,
    ALLOWED_FILE_TYPES,
    FILE_LIMITS,
    ensureUploadsDirectory,
};

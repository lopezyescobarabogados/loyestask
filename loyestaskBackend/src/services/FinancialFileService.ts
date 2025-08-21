import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Configuración específica para archivos financieros
export const FINANCIAL_FILE_TYPES = {
    // Documentos financieros
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    
    // Imágenes (facturas escaneadas)
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'image/tif': '.tif',
    
    // Archivos comprimidos
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    
    // Otros formatos comunes en finanzas
    'application/json': '.json',
    'application/xml': '.xml',
};

// Límites específicos para archivos financieros
export const FINANCIAL_FILE_LIMITS = {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB por archivo
    MAX_FILES_PER_DOCUMENT: 15,      // Máximo 15 archivos por factura/pago
    MAX_TOTAL_SIZE_PER_DOCUMENT: 100 * 1024 * 1024, // 100MB total por documento
};

// Directorios para archivos financieros
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const FINANCIAL_UPLOADS_DIR = path.join(UPLOADS_DIR, 'financial');
const INVOICES_UPLOADS_DIR = path.join(FINANCIAL_UPLOADS_DIR, 'invoices');
const PAYMENTS_UPLOADS_DIR = path.join(FINANCIAL_UPLOADS_DIR, 'payments');
const DEBTS_UPLOADS_DIR = path.join(FINANCIAL_UPLOADS_DIR, 'debts');
const EXPENSES_UPLOADS_DIR = path.join(FINANCIAL_UPLOADS_DIR, 'expenses');

// Crear directorios financieros si no existen
export const ensureFinancialDirectories = async (): Promise<void> => {
    const directories = [
        UPLOADS_DIR,
        FINANCIAL_UPLOADS_DIR,
        INVOICES_UPLOADS_DIR,
        PAYMENTS_UPLOADS_DIR,
        DEBTS_UPLOADS_DIR,
        EXPENSES_UPLOADS_DIR
    ];

    for (const dir of directories) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
};

// Storage dinámico basado en el tipo de documento
const getStorageDestination = (documentType: string) => {
    switch (documentType) {
        case 'invoice':
            return INVOICES_UPLOADS_DIR;
        case 'payment':
            return PAYMENTS_UPLOADS_DIR;
        case 'debt':
            return DEBTS_UPLOADS_DIR;
        case 'expense':
            return EXPENSES_UPLOADS_DIR;
        default:
            return FINANCIAL_UPLOADS_DIR;
    }
};

// Configuración de storage específico para documentos financieros
const financialStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureFinancialDirectories();
            const documentType = req.params.type || 'general';
            const documentId = req.params.id || 'temp';
            
            const baseDir = getStorageDestination(documentType);
            const documentDir = path.join(baseDir, documentId);
            
            try {
                await fs.access(documentDir);
            } catch {
                await fs.mkdir(documentDir, { recursive: true });
            }
            
            cb(null, documentDir);
        } catch (error) {
            cb(error as Error, '');
        }
    },
    filename: (req, file, cb) => {
        // Generar nombre único y descriptivo
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(6).toString('hex');
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt)
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 30);
        
        const uniqueFileName = `${timestamp}_${randomString}_${baseName}${fileExt}`;
        cb(null, uniqueFileName);
    }
});

// Filtro de archivos específico para documentos financieros
const financialFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Verificar tipo de archivo
    if (!FINANCIAL_FILE_TYPES[file.mimetype as keyof typeof FINANCIAL_FILE_TYPES]) {
        const error = new Error(
            `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos para documentos financieros: ${Object.keys(FINANCIAL_FILE_TYPES).join(', ')}`
        ) as any;
        error.code = 'INVALID_FINANCIAL_FILE_TYPE';
        return cb(error, false);
    }
    
    cb(null, true);
};

// Middleware de multer para archivos financieros
export const financialUploadMiddleware = multer({
    storage: financialStorage,
    limits: {
        fileSize: FINANCIAL_FILE_LIMITS.MAX_FILE_SIZE,
        files: FINANCIAL_FILE_LIMITS.MAX_FILES_PER_DOCUMENT,
    },
    fileFilter: financialFileFilter,
});

// Validación de tamaño total de archivos para un documento
export const validateTotalFileSize = (files: Express.Multer.File[]): boolean => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize <= FINANCIAL_FILE_LIMITS.MAX_TOTAL_SIZE_PER_DOCUMENT;
};

// Función para eliminar archivos de un documento
export const deleteDocumentFiles = async (documentType: string, documentId: string): Promise<void> => {
    try {
        const baseDir = getStorageDestination(documentType);
        const documentDir = path.join(baseDir, documentId);
        
        try {
            await fs.access(documentDir);
            await fs.rm(documentDir, { recursive: true, force: true });
        } catch (error) {
            // El directorio no existe, no es un error
        }
    } catch (error) {
        console.error(`Error eliminando archivos del documento ${documentId}:`, error);
        throw error;
    }
};

// Función para eliminar un archivo específico
export const deleteSpecificFile = async (filePath: string): Promise<void> => {
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (error) {
        console.error(`Error eliminando archivo ${filePath}:`, error);
        throw error;
    }
};

// Función para obtener información de archivos de un documento
export const getDocumentFiles = async (documentType: string, documentId: string): Promise<any[]> => {
    try {
        const baseDir = getStorageDestination(documentType);
        const documentDir = path.join(baseDir, documentId);
        
        try {
            await fs.access(documentDir);
            const files = await fs.readdir(documentDir);
            
            const fileInfos = await Promise.all(
                files.map(async (fileName) => {
                    const filePath = path.join(documentDir, fileName);
                    const stats = await fs.stat(filePath);
                    
                    return {
                        fileName,
                        originalName: fileName.split('_').slice(2).join('_') || fileName,
                        filePath,
                        fileSize: stats.size,
                        uploadedAt: stats.birthtime,
                        mimeType: getMimeTypeFromExtension(path.extname(fileName)),
                    };
                })
            );
            
            return fileInfos;
        } catch {
            return [];
        }
    } catch (error) {
        console.error(`Error obteniendo archivos del documento ${documentId}:`, error);
        return [];
    }
};

// Función para obtener tipo MIME desde extensión
const getMimeTypeFromExtension = (extension: string): string => {
    const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.json': 'application/json',
        '.xml': 'application/xml',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

// Función para validar y procesar archivos subidos
export const processFinancialFiles = (files: Express.Multer.File[]): any[] => {
    return files.map(file => ({
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
    }));
};

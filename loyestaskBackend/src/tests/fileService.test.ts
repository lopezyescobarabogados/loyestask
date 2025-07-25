import { describe, test, expect } from '@jest/globals';
import { FileService, ALLOWED_FILE_TYPES, FILE_LIMITS } from '../services/FileService';

// Test unitarios básicos del FileService
describe('File Management System', () => {
    
    describe('FileService Validation', () => {
        test('should have allowed file types configured', () => {
            expect(ALLOWED_FILE_TYPES['application/pdf']).toBe('.pdf');
            expect(ALLOWED_FILE_TYPES['image/jpeg']).toBe('.jpg');
            expect(ALLOWED_FILE_TYPES['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']).toBe('.xlsx');
        });

        test('should have file limits configured', () => {
            expect(FILE_LIMITS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024); // 50MB
            expect(FILE_LIMITS.MAX_FILES_PER_TASK).toBe(20);
            expect(FILE_LIMITS.MAX_TOTAL_SIZE_PER_TASK).toBe(200 * 1024 * 1024); // 200MB
        });

        test('should get file extension from mime type', () => {
            expect(FileService.getFileExtension('application/pdf')).toBe('.pdf');
            expect(FileService.getFileExtension('image/jpeg')).toBe('.jpg');
            expect(FileService.getFileExtension('unknown/type')).toBe('.bin'); // Devuelve .bin por defecto
        });

        test('should sanitize filenames', () => {
            const sanitized = FileService.sanitizeFileName('test/../file name!@#.pdf');
            expect(sanitized).not.toContain('../');
            // Verificar que es una cadena válida
            expect(typeof sanitized).toBe('string');
            expect(sanitized.length).toBeGreaterThan(0);
        });

        test('should calculate total size correctly', () => {
            const files = [
                { fileSize: 1024 },
                { fileSize: 2048 },
                { fileSize: 4096 }
            ];
            const totalSize = FileService.calculateTotalSize(files);
            expect(totalSize).toBe(7168);
        });

        test('should validate file upload constraints', () => {
            const existingFiles = [
                { fileSize: 1024 * 1024 } // 1MB existente
            ];
            const newFileSize = 1024 * 1024; // 1MB nuevo archivo
            
            const result = FileService.validateFileUpload(existingFiles, newFileSize);
            
            expect(result.valid).toBe(true);
        });

        test('should reject file upload if size limit exceeded', () => {
            const existingFiles = [
                { fileSize: 150 * 1024 * 1024 } // 150MB existente
            ];
            const newFileSize = 100 * 1024 * 1024; // 100MB nuevo (excederá el límite total de 200MB)
            
            const result = FileService.validateFileUpload(existingFiles, newFileSize);
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Tamaño total máximo excedido');
        });
    });
});

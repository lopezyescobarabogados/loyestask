// Configuración básica para las pruebas
import dotenv from 'dotenv';
dotenv.config();

// Mock de variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/loyestask_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

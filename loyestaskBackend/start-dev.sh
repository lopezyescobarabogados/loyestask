#!/bin/bash

# Script para iniciar el servidor en modo desarrollo simplificado
echo "🔧 Iniciando LoyesTask Backend en modo desarrollo simplificado..."

# Configurar variables de entorno para desarrollo local
export NODE_ENV=development
export PORT=4001
export JWT_SECRET=e13e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5a3b7
export FRONTEND_URL=http://localhost:5173
export FROM_EMAIL=noreply@loyestask.com
export EMAIL_FROM_NAME="LoyesTask - Sistema de Tareas"

# Crear el servidor simplificado
cat > src/server-dev.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import colors from 'colors';
import jwt from 'jsonwebtoken';

const app = express();

// Configuración CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: any) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
    
    // Permitir requests sin origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, true); // En desarrollo, permitir todo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// Mock user para desarrollo
const mockAdminUser = {
  _id: 'mock_admin_id',
  name: 'Administrador',
  email: 'admin@loyestask.com',
  role: 'admin',
  confirmed: true
};

// Middleware de autenticación mock
const mockAuth = (req: any, res: any, next: any) => {
  const bearer = req.headers.authorization;
  
  if (!bearer) {
    return res.status(401).json({ error: 'No Autorizado' });
  }

  const token = bearer.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No Autorizado' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    req.user = mockAdminUser;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token No Válido' });
  }
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@loyestask.com' && password === 'admin123') {
    const token = jwt.sign(
      { id: mockAdminUser._id },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    
    res.json({
      msg: 'Login exitoso (modo desarrollo)',
      token,
      user: mockAdminUser
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', mode: 'development-mock' });
});

// Importar servicios mock
import { MockFinancialService } from './services/MockFinancialService';

// Rutas financieras mock
app.get('/api/financial-exports/available', mockAuth, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const reports = await MockFinancialService.generateMockAvailableReports(targetYear);
    
    res.json({
      msg: "Reportes disponibles obtenidos correctamente",
      reports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/financial-exports/monthly/:year/:month/data', mockAuth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ 
        error: "Año y mes válidos son requeridos (mes: 1-12)" 
      });
    }
    
    const reportData = await MockFinancialService.generateMockMonthlyReport(yearNum, monthNum);
    
    res.json({
      msg: "Datos del reporte obtenidos correctamente",
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    note: 'Servidor en modo desarrollo simplificado'
  });
});

const port = process.env.PORT || 4001;

app.listen(port, () => {
  console.log(colors.cyan.bold(`🚀 Servidor DEV ejecutándose en puerto ${port}`));
  console.log(colors.green.bold(`🌍 LoyesTask DEV está listo para usar`));
  console.log(colors.yellow.bold(`📝 Modo: Desarrollo Simplificado (sin BD)`));
  console.log(colors.blue.bold(`🔑 Credenciales: admin@loyestask.com / admin123`));
});
EOF

# Ejecutar TypeScript directamente
npx ts-node src/server-dev.ts

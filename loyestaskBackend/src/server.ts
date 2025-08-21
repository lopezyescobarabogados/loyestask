import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import userRoutes from "./routes/userRoutes";
import performanceRoutes from "./routes/performanceRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import configRoutes from "./routes/configRoutes";
import pdfRoutes from "./routes/pdfRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import accountRoutes from "./routes/accountRoutes";
import financialPeriodRoutes from "./routes/financialPeriodRoutes";
import financialReportRoutes from "./routes/financialReportRoutes";
import financialExportRoutes from "./routes/financialExportRoutes";
import clientRoutes from "./routes/clientRoutes";
import debtRoutes from "./routes/debtRoutes";
import devRoutes from "./routes/devRoutes";
import { ensureUploadsDirectory } from "./services/FileService";
import { FinancialNotificationService } from "./services/FinancialNotificationService";

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar directorios de uploads
ensureUploadsDirectory().catch(console.error);

// Inicializar servicios de notificaciones financieras
FinancialNotificationService.getInstance();

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security and optimization middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(cors(corsConfig))

//loggin
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'))
} else {
    app.use(morgan('dev'))
}

//leer datos de formularios
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'LoyesTask API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            projects: '/api/projects',
            users: '/api/users',
            performance: '/api/performance',
            notifications: '/api/notifications',
            config: '/api/config',
            pdf: '/api/pdf',
            pdfAdminSummary: '/api/pdf/admin/summary/download',
            invoices: '/api/invoices',
            payments: '/api/payments',
            accounts: '/api/accounts',
            financialPeriods: '/api/financial-periods',
            financialReports: '/api/financial-reports',
            financialExports: '/api/financial-exports',
            clients: '/api/clients',
            debts: '/api/debts'
        }
    });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/config", configRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/financial-periods", financialPeriodRoutes);
app.use("/api/financial-reports", financialReportRoutes);
app.use("/api/financial-exports", financialExportRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/debts", debtRoutes);

// Rutas de desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use("/api/dev", devRoutes);
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message
    });
});

export default app;

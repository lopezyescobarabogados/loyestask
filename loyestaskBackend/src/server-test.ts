import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// CORS básico
app.use(cors());
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
        message: 'LoyesTask API - Test Version',
        version: '1.0.0',
        status: 'running'
    });
});

export default app;

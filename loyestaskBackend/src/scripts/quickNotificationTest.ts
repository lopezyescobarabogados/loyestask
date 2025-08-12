/**
 * Script simple para probar notificaciones manualmente
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NotificationService } from '../services/NotificationService';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://root:IRp5Im45ltfEUmlT@cluster0.eq6fnvc.mongodb.net/loyestask_mern';

async function testNotifications() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Conectado a MongoDB');

        console.log('🔔 Inicializando servicio de notificaciones...');
        const notificationService = NotificationService.getInstance();

        console.log('📧 Probando recordatorios específicos...');
        await notificationService.checkAndSendReminders();

        console.log('📅 Probando recordatorios diarios...');
        await notificationService.checkAndSendDailyReminders();

        console.log('⚠️ Probando tareas vencidas...');
        await notificationService.checkAndNotifyOverdueTasks();

        console.log('✅ Pruebas completadas');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testNotifications();

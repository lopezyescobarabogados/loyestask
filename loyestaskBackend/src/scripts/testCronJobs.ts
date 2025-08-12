/**
 * Script para probar el cron job con frecuencia alta
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NotificationService } from '../services/NotificationService';
import * as cron from 'node-cron';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://root:IRp5Im45ltfEUmlT@cluster0.eq6fnvc.mongodb.net/loyestask_mern';

async function testCronJobs() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Conectado a MongoDB');

        console.log('🔔 Configurando cron jobs de prueba...');
        
        const notificationService = NotificationService.getInstance();

        // Cron job cada 30 segundos para recordatorios específicos
        const specificRemindersCron = cron.schedule('*/30 * * * * *', async () => {
            console.log('\n⏰ [CRON] Ejecutando recordatorios específicos...');
            await notificationService.checkAndSendReminders();
        }, {
            timezone: 'America/Mexico_City'
        });

        // Cron job cada 45 segundos para recordatorios diarios
        const dailyRemindersCron = cron.schedule('*/45 * * * * *', async () => {
            console.log('\n📅 [CRON] Ejecutando recordatorios diarios...');
            await notificationService.checkAndSendDailyReminders();
        }, {
            timezone: 'America/Mexico_City'
        });

        // Cron job cada minuto para tareas vencidas
        const overdueCron = cron.schedule('0 * * * * *', async () => {
            console.log('\n⚠️ [CRON] Verificando tareas vencidas...');
            await notificationService.checkAndNotifyOverdueTasks();
        }, {
            timezone: 'America/Mexico_City'
        });

        console.log('🚀 Iniciando cron jobs de prueba...');
        console.log('   📧 Recordatorios específicos: cada 30 segundos');
        console.log('   📅 Recordatorios diarios: cada 45 segundos');
        console.log('   ⚠️ Tareas vencidas: cada minuto');
        console.log('   ⏹️ Presiona Ctrl+C para detener');

        // Los cron jobs se inician automáticamente

        // Ejecutar una vez inmediatamente
        console.log('\n🧪 Ejecutando prueba inicial...');
        await notificationService.checkAndSendReminders();
        await notificationService.checkAndSendDailyReminders();
        await notificationService.checkAndNotifyOverdueTasks();

        // Mantener el proceso corriendo
        process.on('SIGINT', () => {
            console.log('\n🛑 Deteniendo cron jobs...');
            specificRemindersCron.stop();
            dailyRemindersCron.stop();
            overdueCron.stop();
            mongoose.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testCronJobs();

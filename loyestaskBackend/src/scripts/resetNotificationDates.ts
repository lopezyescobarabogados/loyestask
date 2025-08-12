/**
 * Script para resetear las fechas de envío de notificaciones para permitir nuevas pruebas
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NotificationPreference from '../models/NotificationPreference';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://root:IRp5Im45ltfEUmlT@cluster0.eq6fnvc.mongodb.net/loyestask_mern';

async function resetNotificationDates() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Conectado a MongoDB');

        console.log('🔄 Reseteando fechas de envío de notificaciones...');
        
        const result = await NotificationPreference.updateMany(
            {},
            {
                $unset: {
                    lastSentAt: 1,
                    lastDailyReminderAt: 1
                }
            }
        );

        console.log(`✅ Se resetearon ${result.modifiedCount} preferencias de notificación`);
        console.log('🧪 Las notificaciones ahora pueden enviarse nuevamente');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetNotificationDates();

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import colors from 'colors';
import { connectDB } from '../config/db';
import NotificationPreference from '../models/NotificationPreference';

// Cargar variables de entorno
dotenv.config();

/**
 * Script de migración para agregar los nuevos campos de recordatorios diarios
 * a las preferencias de notificación existentes
 */
async function migrateNotificationPreferences() {
  try {
    console.log(colors.blue.bold('🔄 Iniciando migración de preferencias de notificación...'));
    
    await connectDB();
    
    // Agregar campos que faltan a documentos existentes
    const result = await NotificationPreference.updateMany(
      {
        // Documentos que no tienen el campo isDailyReminderEnabled
        isDailyReminderEnabled: { $exists: false }
      },
      {
        $set: {
          isDailyReminderEnabled: false // Por defecto deshabilitado
        }
      }
    );

    console.log(colors.green.bold(`✅ Migración completada: ${result.modifiedCount} documentos actualizados`));

    // Verificar índices
    const indexes = await NotificationPreference.collection.getIndexes();
    console.log(colors.cyan.bold('📊 Índices existentes:'));
    Object.keys(indexes).forEach(indexName => {
      console.log(colors.cyan(`  - ${indexName}`));
    });

    // Crear nuevos índices si no existen
    try {
      await NotificationPreference.collection.createIndex({
        isDailyReminderEnabled: 1,
        lastDailyReminderAt: 1
      });
      console.log(colors.green.bold('✅ Índice para recordatorios diarios creado'));
    } catch (error) {
      console.log(colors.yellow.bold('⚠️ Índice para recordatorios diarios ya existe'));
    }

    console.log(colors.green.bold('🎉 Migración completada exitosamente'));
    
  } catch (error) {
    console.error(colors.red.bold('❌ Error durante la migración:'));
    console.error(colors.red(error.message));
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(colors.blue.bold('📝 Conexión a la base de datos cerrada'));
  }
}

// Ejecutar migración si el script se ejecuta directamente
if (require.main === module) {
  migrateNotificationPreferences();
}

export default migrateNotificationPreferences;

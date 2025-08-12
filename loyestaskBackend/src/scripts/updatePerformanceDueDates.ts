/**
 * Script para migrar y sincronizar las fechas de entrega en los registros de performance
 * con las fechas actuales de las tareas
 */

import mongoose from 'mongoose';
import Task from '../models/Task';
import UserPerformance from '../models/UserPerformance';
import { calculateWorkingDays } from '../utils/workingDays';

// Configuración de la base de datos
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://root:IRp5Im45ltfEUmlT@cluster0.eq6fnvc.mongodb.net/loyestask_mern';

async function connectToDatabase() {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
        process.exit(1);
    }
}

async function updatePerformanceDueDates() {
    try {
        console.log('🔄 Iniciando migración de fechas de entrega en performance...');

        // Obtener todas las tareas con sus fechas actuales
        const tasks = await Task.find({}, '_id dueDate createdAt').lean();
        console.log(`📊 Encontradas ${tasks.length} tareas para procesar`);

        let updatedRecords = 0;
        let recalculatedRecords = 0;

        for (const task of tasks) {
            // Buscar registros de performance para esta tarea
            const performanceRecords = await UserPerformance.find({ task: task._id });

            if (performanceRecords.length === 0) continue;

            for (const performance of performanceRecords) {
                let needsUpdate = false;

                // Verificar si la fecha de entrega en performance es diferente a la de la tarea
                if (performance.dueDate.getTime() !== task.dueDate.getTime()) {
                    console.log(`📅 Actualizando fecha de entrega para tarea ${task._id}:`);
                    console.log(`   Anterior: ${performance.dueDate.toISOString().split('T')[0]}`);
                    console.log(`   Nueva: ${task.dueDate.toISOString().split('T')[0]}`);
                    
                    performance.dueDate = task.dueDate;
                    needsUpdate = true;
                    updatedRecords++;
                }

                // Si la tarea está completada, recalcular isOnTime con la fecha correcta
                if (performance.isCompleted && performance.completionTime !== null) {
                    const dueDateWorkingDays = calculateWorkingDays(task.createdAt, task.dueDate);
                    const newIsOnTime = performance.completionTime <= dueDateWorkingDays;
                    
                    if (performance.isOnTime !== newIsOnTime) {
                        console.log(`⏱️  Recalculando isOnTime para tarea ${task._id}:`);
                        console.log(`   Anterior: ${performance.isOnTime}`);
                        console.log(`   Nuevo: ${newIsOnTime}`);
                        console.log(`   Tiempo de finalización: ${performance.completionTime} días`);
                        console.log(`   Días laborables permitidos: ${dueDateWorkingDays} días`);
                        
                        performance.isOnTime = newIsOnTime;
                        needsUpdate = true;
                        recalculatedRecords++;
                    }
                }

                if (needsUpdate) {
                    await performance.save();
                }
            }
        }

        console.log('✅ Migración completada:');
        console.log(`   📊 Registros con fechas actualizadas: ${updatedRecords}`);
        console.log(`   ⏱️  Registros con isOnTime recalculado: ${recalculatedRecords}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

async function main() {
    try {
        await connectToDatabase();
        await updatePerformanceDueDates();
        console.log('🎉 Migración completada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('💥 Error en la migración:', error);
        process.exit(1);
    }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    main();
}

export { updatePerformanceDueDates };

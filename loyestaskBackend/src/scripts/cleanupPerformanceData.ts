import mongoose from 'mongoose';
import UserPerformance from '../models/UserPerformance';
import Task from '../models/Task';
import { calculateWorkingDays } from '../utils/workingDays';

// Configurar conexión
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/loyestask');

async function cleanupPerformanceData() {
    console.log('🧹 Iniciando limpieza de datos de performance...\n');

    try {
        // 1. Limpiar registros huérfanos (sin tarea asociada)
        console.log('📋 1. Eliminando registros huérfanos...');
        const orphanedRecords = await UserPerformance.aggregate([
            {
                $lookup: {
                    from: 'tasks',
                    localField: 'task',
                    foreignField: '_id',
                    as: 'taskExists'
                }
            },
            {
                $match: {
                    taskExists: { $size: 0 }
                }
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (orphanedRecords.length > 0) {
            const orphanedIds = orphanedRecords.map(r => r._id);
            const deleteResult = await UserPerformance.deleteMany({ _id: { $in: orphanedIds } });
            console.log(`   ✅ Eliminados ${deleteResult.deletedCount} registros huérfanos`);
        } else {
            console.log('   ✅ No se encontraron registros huérfanos');
        }

        // 2. Reparar registros con isOnTime null pero completados
        console.log('\n📋 2. Reparando registros con isOnTime null...');
        const nullIsOnTimeRecords = await UserPerformance.find({
            isCompleted: true,
            isOnTime: null,
            completionTime: { $ne: null }
        }).populate('task');

        let repairedCount = 0;
        for (const performance of nullIsOnTimeRecords) {
            const task = performance.task as any;
            if (task && task.createdAt && task.dueDate) {
                // Recalcular isOnTime
                const dueDateWorkingDays = calculateWorkingDays(task.createdAt, task.dueDate);
                const isOnTime = performance.completionTime! <= dueDateWorkingDays;
                
                await UserPerformance.updateOne(
                    { _id: performance._id },
                    { isOnTime: isOnTime }
                );
                
                console.log(`   🔧 Reparado: Performance ${performance._id} -> isOnTime: ${isOnTime}`);
                repairedCount++;
            }
        }
        console.log(`   ✅ Reparados ${repairedCount} registros con isOnTime null`);

        // 3. Validar y reparar registros con completionTime null pero completados
        console.log('\n📋 3. Reparando registros con completionTime null...');
        const nullCompletionTimeRecords = await UserPerformance.find({
            isCompleted: true,
            completionTime: null
        }).populate('task');

        let completionTimeRepairedCount = 0;
        for (const performance of nullCompletionTimeRecords) {
            const task = performance.task as any;
            if (task && task.createdAt && performance.statusChanges.length > 0) {
                // Buscar el último cambio a 'completed'
                const completedChange = performance.statusChanges
                    .filter(change => change.status === 'completed')
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

                if (completedChange) {
                    const completionTime = completedChange.workingDaysFromStart;
                    const dueDateWorkingDays = calculateWorkingDays(task.createdAt, task.dueDate);
                    const isOnTime = completionTime <= dueDateWorkingDays;

                    await UserPerformance.updateOne(
                        { _id: performance._id },
                        { 
                            completionTime: completionTime,
                            isOnTime: isOnTime
                        }
                    );

                    console.log(`   🔧 Reparado: Performance ${performance._id} -> completionTime: ${completionTime}, isOnTime: ${isOnTime}`);
                    completionTimeRepairedCount++;
                }
            }
        }
        console.log(`   ✅ Reparados ${completionTimeRepairedCount} registros con completionTime null`);

        // 4. Estadísticas finales
        console.log('\n📊 Estadísticas finales:');
        const totalRecords = await UserPerformance.countDocuments();
        const completedRecords = await UserPerformance.countDocuments({ isCompleted: true });
        const validCompletedRecords = await UserPerformance.countDocuments({
            isCompleted: true,
            isOnTime: { $ne: null },
            completionTime: { $ne: null }
        });

        console.log(`   📋 Total de registros: ${totalRecords}`);
        console.log(`   ✅ Registros completados: ${completedRecords}`);
        console.log(`   ✅ Registros completados válidos: ${validCompletedRecords}`);
        console.log(`   📊 Integridad de datos: ${((validCompletedRecords / completedRecords) * 100).toFixed(2)}%`);

        console.log('\n🎉 Limpieza completada exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    cleanupPerformanceData();
}

export default cleanupPerformanceData;

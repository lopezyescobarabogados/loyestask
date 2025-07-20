import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import UserPerformance from '../models/UserPerformance';
import { calculateWorkingDaysFromStart, calculateWorkingDays } from '../utils/workingDays';

dotenv.config();

const migrateExistingData = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Iniciando migración de datos existentes...');
    
    // Obtener todas las tareas que tienen historial de cambios de estado
    const tasks = await Task.find({
      'completedBy.0': { $exists: true }
    });
    
    console.log(`📊 Encontradas ${tasks.length} tareas con historial de estado`);
    
    let migratedCount = 0;
    
    for (const task of tasks) {
      for (const completion of task.completedBy) {
        const userId = completion.user; // Ahora user es un ObjectId
        if (!userId) continue;
        
        // Verificar si ya existe un registro de performance para esta combinación
        const existingPerformance = await UserPerformance.findOne({
          user: userId,
          task: task._id
        });
        
        if (existingPerformance) {
          console.log(`⏭️  Ya existe registro para usuario ${userId} en tarea ${task.name}`);
          continue;
        }
        
        // Calcular días laborables desde la creación hasta el cambio de estado
        const workingDaysFromStart = calculateWorkingDaysFromStart(task.createdAt);
        
        // Crear registro de performance
        const performance = new UserPerformance({
          user: userId,
          task: task._id,
          project: task.project,
          statusChanges: [{
            status: completion.status,
            timestamp: task.updatedAt, // Usamos updatedAt como aproximación
            workingDaysFromStart
          }],
          dueDate: task.dueDate || new Date(),
          isCompleted: completion.status === 'completed',
          isOnTime: null
        });
        
        // Si la tarea está completada, calcular métricas finales
        if (completion.status === 'completed') {
          performance.completionTime = workingDaysFromStart;
          
          if (task.dueDate) {
            const dueDateWorkingDays = calculateWorkingDays(task.createdAt, task.dueDate);
            performance.isOnTime = workingDaysFromStart <= dueDateWorkingDays;
          }
        }
        
        await performance.save();
        migratedCount++;
        
        console.log(`✅ Migrado: ${userId} - ${task.name} (${completion.status})`);
      }
    }
    
    console.log(`🎉 Migración completada. ${migratedCount} registros creados.`);
    
    // Mostrar estadísticas
    const totalPerformanceRecords = await UserPerformance.countDocuments();
    const completedTasks = await UserPerformance.countDocuments({ isCompleted: true });
    const onTimeTasks = await UserPerformance.countDocuments({ isOnTime: true });
    
    console.log('\n📈 Estadísticas finales:');
    console.log(`- Total de registros de performance: ${totalPerformanceRecords}`);
    console.log(`- Tareas completadas: ${completedTasks}`);
    console.log(`- Tareas completadas a tiempo: ${onTimeTasks}`);
    
    if (completedTasks > 0) {
      const onTimePercentage = ((onTimeTasks / completedTasks) * 100).toFixed(1);
      console.log(`- Porcentaje de puntualidad general: ${onTimePercentage}%`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  migrateExistingData();
}

export default migrateExistingData;

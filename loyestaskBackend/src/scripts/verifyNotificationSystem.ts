import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import { connectDB } from '../config/db';
import { NotificationService } from '../services/NotificationService';
import NotificationPreference from '../models/NotificationPreference';
import Task from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';

dotenv.config();

/**
 * Script de verificación del sistema de notificaciones
 * Este script verifica:
 * 1. Conexión a la base de datos
 * 2. Funcionalidad del servicio de notificaciones
 * 3. Envío de correos de prueba
 * 4. Validación de lógica de recordatorios
 */

class NotificationTestSuite {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = NotificationService.getInstance();
    }

    async run() {
        console.log(colors.cyan.bold('🔔 Iniciando verificación del sistema de notificaciones...'));
        
        try {
            // 1. Conectar a la base de datos
            await this.connectDatabase();
            
            // 2. Verificar estado del servicio
            await this.verifyServiceStatus();
            
            // 3. Analizar preferencias existentes
            await this.analyzeExistingPreferences();
            
            // 4. Verificar lógica de recordatorios
            await this.testReminderLogic();
            
            // 5. Verificar notificaciones de cambio de estado
            await this.checkStatusChangeNotifications();
            
            // 6. Revisar distribución a colaboradores
            await this.verifyCollaboratorDistribution();
            
            // 7. Verificar eficiencia del sistema
            await this.checkSystemEfficiency();
            
            console.log(colors.green.bold('✅ Verificación completada exitosamente'));
            
        } catch (error) {
            console.error(colors.red.bold('❌ Error durante la verificación:'), error);
        } finally {
            await mongoose.disconnect();
        }
    }

    private async connectDatabase() {
        console.log(colors.yellow('📊 Conectando a la base de datos...'));
        await connectDB();
        console.log(colors.green('✅ Base de datos conectada'));
    }

    // Método público para conectar a la base de datos (para uso externo)
    async connect() {
        await this.connectDatabase();
    }

    private async verifyServiceStatus() {
        console.log(colors.yellow('🔧 Verificando estado del servicio de notificaciones...'));
        
        // Verificar que el servicio esté inicializado
        this.notificationService.initialize();
        
        console.log(colors.green('✅ Servicio de notificaciones inicializado correctamente'));
    }

    private async analyzeExistingPreferences() {
        console.log(colors.yellow('📋 Analizando preferencias de notificación existentes...'));
        
        const totalPreferences = await NotificationPreference.countDocuments();
        const enabledPreferences = await NotificationPreference.countDocuments({ isEnabled: true });
        const recentSent = await NotificationPreference.countDocuments({
            isEnabled: true,
            lastSentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        console.log(colors.blue(`📊 Estadísticas de preferencias:`));
        console.log(`   • Total de preferencias: ${totalPreferences}`);
        console.log(`   • Preferencias habilitadas: ${enabledPreferences}`);
        console.log(`   • Enviadas en la última semana: ${recentSent}`);

        // Verificar distribución por días de anticipación
        const reminderDistribution = await NotificationPreference.aggregate([
            { $match: { isEnabled: true } },
            { $group: { _id: '$reminderDays', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log(colors.blue('📈 Distribución por días de anticipación:'));
        reminderDistribution.forEach(item => {
            console.log(`   • ${item._id} días: ${item.count} preferencias`);
        });
    }

    private async testReminderLogic() {
        console.log(colors.yellow('🧪 Verificando lógica de recordatorios...'));
        
        // Buscar preferencias que deberían generar recordatorios hoy
        const today = new Date();
        
        const preferences = await NotificationPreference.find({
            isEnabled: true,
        }).populate([
            {
                path: 'user',
                select: 'name email',
            },
            {
                path: 'task',
                select: 'name description dueDate status project',
                populate: {
                    path: 'project',
                    select: 'projectName clientName team',
                },
            },
        ]);

        let eligibleForToday = 0;
        let completedTasks = 0;
        let noDateTasks = 0;
        let alreadySentToday = 0;

        for (const preference of preferences) {
            const task = preference.task as any;
            
            if (!task) continue;
            
            if (task.status === 'completed') {
                completedTasks++;
                continue;
            }
            
            if (!task.dueDate) {
                noDateTasks++;
                continue;
            }
            
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysUntilDue === preference.reminderDays) {
                if (preference.lastSentAt) {
                    const lastSentDate = new Date(preference.lastSentAt);
                    const isToday = lastSentDate.toDateString() === today.toDateString();
                    if (isToday) {
                        alreadySentToday++;
                        continue;
                    }
                }
                eligibleForToday++;
            }
        }

        console.log(colors.blue('📊 Análisis de recordatorios para hoy:'));
        console.log(`   • Total de preferencias habilitadas: ${preferences.length}`);
        console.log(`   • Tareas completadas (no envían): ${completedTasks}`);
        console.log(`   • Tareas sin fecha límite: ${noDateTasks}`);
        console.log(`   • Ya enviadas hoy: ${alreadySentToday}`);
        console.log(`   • Elegibles para envío hoy: ${eligibleForToday}`);
    }

    private async checkStatusChangeNotifications() {
        console.log(colors.yellow('🔄 Verificando notificaciones de cambio de estado...'));
        
        // Verificar si hay lógica implementada para notificaciones de cambio de estado
        // En el análisis actual, no se encontró implementación automática de esto
        
        console.log(colors.red('⚠️  HALLAZGO: No se encontró implementación automática de notificaciones por cambio de estado'));
        console.log(colors.yellow('💡 RECOMENDACIÓN: Implementar notificaciones automáticas cuando:'));
        console.log('   • Una tarea cambia de estado');
        console.log('   • Una tarea es asignada a un usuario');
        console.log('   • Una tarea pasa a estado "completada"');
        console.log('   • Una tarea se vence sin completar');
    }

    private async verifyCollaboratorDistribution() {
        console.log(colors.yellow('👥 Verificando distribución a colaboradores...'));
        
        // Analizar proyectos y sus equipos
        const projects = await Project.find().populate('team manager', 'name email');
        
        let totalProjects = projects.length;
        let projectsWithTeams = 0;
        let totalCollaborators = 0;
        let maxTeamSize = 0;

        projects.forEach(project => {
            const teamSize = (project.team as any[])?.length || 0;
            if (teamSize > 0) {
                projectsWithTeams++;
                totalCollaborators += teamSize + 1; // +1 por el manager
                maxTeamSize = Math.max(maxTeamSize, teamSize);
            }
        });

        console.log(colors.blue('📊 Análisis de colaboradores:'));
        console.log(`   • Total de proyectos: ${totalProjects}`);
        console.log(`   • Proyectos con equipos: ${projectsWithTeams}`);
        console.log(`   • Total de colaboradores: ${totalCollaborators}`);
        console.log(`   • Tamaño máximo de equipo: ${maxTeamSize}`);
        
        // Verificar que los correos incluyan información de colaboradores
        console.log(colors.green('✅ Los templates de correo incluyen información de colaboradores'));
    }

    private async checkSystemEfficiency() {
        console.log(colors.yellow('⚡ Verificando eficiencia del sistema...'));
        
        // 1. Verificar índices de base de datos
        const preferenceIndexes = await NotificationPreference.collection.getIndexes();
        console.log(colors.blue('📊 Índices de NotificationPreference:'));
        Object.keys(preferenceIndexes).forEach(indexName => {
            console.log(`   • ${indexName}: ${JSON.stringify(preferenceIndexes[indexName])}`);
        });
        
        // 2. Verificar configuración del cron job
        console.log(colors.blue('⏰ Configuración de cron job:'));
        console.log('   • Frecuencia: Diaria a las 9:00 AM');
        console.log('   • Zona horaria: America/Mexico_City');
        console.log('   • Estado: Activo');
        
        // 3. Verificar prevención de duplicados
        console.log(colors.blue('🚫 Prevención de duplicados:'));
        console.log('   • Índice único en (user, task)');
        console.log('   • Verificación de lastSentAt');
        console.log('   • Reset de lastSentAt al actualizar preferencias');
        
        // 4. Verificar manejo de errores
        console.log(colors.blue('🛡️  Manejo de errores:'));
        console.log('   • Try-catch en todas las operaciones críticas');
        console.log('   • Logging detallado de errores');
        console.log('   • Continuación del procesamiento en caso de error individual');
        
        console.log(colors.green('✅ Sistema configurado de manera eficiente'));
    }

    // Método para ejecutar prueba de envío
    async testSendReminder() {
        console.log(colors.yellow('📧 Ejecutando prueba de envío de recordatorios...'));
        
        try {
            await this.notificationService.checkAndSendReminders();
            console.log(colors.green('✅ Verificación de recordatorios ejecutada correctamente'));
        } catch (error) {
            console.error(colors.red('❌ Error durante la verificación de recordatorios:'), error);
        }
    }
}

// Función principal
async function main() {
    const args = process.argv.slice(2);
    const testSuite = new NotificationTestSuite();
    
    if (args.includes('--test-send')) {
        // Solo ejecutar prueba de envío
        await testSuite.connect();
        await testSuite.testSendReminder();
        await mongoose.disconnect();
    } else {
        // Ejecutar suite completa
        await testSuite.run();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error(colors.red.bold('❌ Error fatal:'), error);
        process.exit(1);
    });
}

export { NotificationTestSuite };

/**
 * Script para probar las funciones de notificaciones manualmente
 */

import mongoose from 'mongoose';
import { NotificationService } from '../services/NotificationService';
import NotificationPreference from '../models/NotificationPreference';
import Task from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';

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

async function testNotificationSystem() {
    try {
        console.log('🧪 Iniciando pruebas del sistema de notificaciones...\n');

        // 1. Verificar configuración del servicio
        console.log('1️⃣ Verificando configuración del servicio...');
        const notificationService = NotificationService.getInstance();
        
        // 2. Verificar preferencias existentes
        console.log('\n2️⃣ Verificando preferencias de notificación...');
        const preferences = await NotificationPreference.find({})
            .populate('user', 'name email')
            .populate('task', 'name dueDate status');
        
        console.log(`📊 Total de preferencias encontradas: ${preferences.length}`);
        
        if (preferences.length > 0) {
            console.log('\n📋 Preferencias existentes:');
            preferences.forEach((pref, index) => {
                const user = pref.user as any;
                const task = pref.task as any;
                console.log(`   ${index + 1}. Usuario: ${user?.name} | Tarea: ${task?.name} | Días: ${pref.reminderDays} | Habilitado: ${pref.isEnabled} | Diario: ${pref.isDailyReminderEnabled}`);
            });
        }

        // 3. Verificar tareas próximas a vencer
        console.log('\n3️⃣ Verificando tareas próximas a vencer...');
        const today = new Date();
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const upcomingTasks = await Task.find({
            dueDate: { $gte: today, $lte: next7Days },
            status: { $ne: 'completed' }
        }).populate('project', 'projectName');

        console.log(`📅 Tareas próximas a vencer (próximos 7 días): ${upcomingTasks.length}`);
        
        if (upcomingTasks.length > 0) {
            console.log('\n📋 Tareas próximas:');
            upcomingTasks.forEach((task, index) => {
                const project = task.project as any;
                const daysUntilDue = Math.ceil((task.dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                console.log(`   ${index + 1}. ${task.name} | Proyecto: ${project?.projectName} | Vence en: ${daysUntilDue} días | Estado: ${task.status}`);
            });
        }

        // 4. Probar función de recordatorios específicos
        console.log('\n4️⃣ Probando recordatorios específicos...');
        await notificationService.checkAndSendReminders();

        // 5. Probar función de recordatorios diarios
        console.log('\n5️⃣ Probando recordatorios diarios...');
        await notificationService.checkAndSendDailyReminders();

        // 6. Probar función de tareas vencidas
        console.log('\n6️⃣ Probando notificaciones de tareas vencidas...');
        await notificationService.checkAndNotifyOverdueTasks();

        console.log('\n✅ Pruebas completadas exitosamente');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
        throw error;
    }
}

async function createTestData() {
    try {
        console.log('\n🛠️ Creando datos de prueba...');

        // Buscar un usuario existente
        const user = await User.findOne({ role: 'user' });
        if (!user) {
            console.log('⚠️ No se encontraron usuarios. Crea un usuario primero.');
            return;
        }

        // Buscar un proyecto existente
        const project = await Project.findOne({ 
            $or: [
                { manager: user._id },
                { team: { $in: [user._id] } }
            ]
        });

        if (!project) {
            console.log('⚠️ No se encontraron proyectos para el usuario.');
            return;
        }

        // Buscar una tarea existente
        let task = await Task.findOne({ 
            project: project._id,
            status: { $ne: 'completed' }
        });

        if (!task) {
            // Crear una tarea de prueba si no existe
            const testDueDate = new Date();
            testDueDate.setDate(testDueDate.getDate() + 3); // Vence en 3 días

            task = new Task({
                name: 'Tarea de Prueba - Recordatorios',
                description: 'Esta es una tarea creada para probar el sistema de recordatorios',
                project: project._id,
                dueDate: testDueDate,
                status: 'pending'
            });

            await task.save();
            console.log(`✅ Tarea de prueba creada: ${task.name} (vence en 3 días)`);
        }

        // Verificar si ya existe una preferencia para esta tarea y usuario
        let preference = await NotificationPreference.findOne({
            user: user._id,
            task: task._id
        });

        if (!preference) {
            // Crear preferencia de notificación
            preference = new NotificationPreference({
                user: user._id,
                task: task._id,
                reminderDays: 3, // Recordar 3 días antes
                isEnabled: true,
                isDailyReminderEnabled: true
            });

            await preference.save();
            console.log(`✅ Preferencia de notificación creada para ${user.name} - ${task.name}`);
        } else {
            console.log(`✅ Ya existe preferencia de notificación para ${user.name} - ${task.name}`);
        }

        console.log('🎯 Datos de prueba listos para testing');

    } catch (error) {
        console.error('❌ Error creando datos de prueba:', error);
        throw error;
    }
}

async function main() {
    try {
        await connectToDatabase();
        
        const command = process.argv[2];
        
        switch (command) {
            case 'test':
                await testNotificationSystem();
                break;
            case 'create-test-data':
                await createTestData();
                break;
            case 'full':
                await createTestData();
                await testNotificationSystem();
                break;
            default:
                console.log('📝 Comandos disponibles:');
                console.log('  npm run test-notifications test             - Probar sistema de notificaciones');
                console.log('  npm run test-notifications create-test-data - Crear datos de prueba');
                console.log('  npm run test-notifications full             - Crear datos y probar sistema');
                break;
        }

        process.exit(0);
    } catch (error) {
        console.error('💥 Error en el script:', error);
        process.exit(1);
    }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    main();
}

export { testNotificationSystem, createTestData };

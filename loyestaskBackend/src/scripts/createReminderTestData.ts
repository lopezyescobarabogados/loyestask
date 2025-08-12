/**
 * Script para crear datos de prueba específicos para recordatorios
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';
import NotificationPreference from '../models/NotificationPreference';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://root:IRp5Im45ltfEUmlT@cluster0.eq6fnvc.mongodb.net/loyestask_mern';

async function createReminderTestData() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Conectado a MongoDB');

        // Buscar usuario existente
        const user = await User.findOne({ role: 'user' });
        if (!user) {
            console.log('❌ No se encontró ningún usuario. Crea un usuario primero.');
            return;
        }

        // Buscar proyecto existente
        const project = await Project.findOne({
            $or: [
                { manager: user._id },
                { team: { $in: [user._id] } }
            ]
        });

        if (!project) {
            console.log('❌ No se encontró ningún proyecto para el usuario.');
            return;
        }

        console.log(`👤 Usuario: ${user.name} (${user.email})`);
        console.log(`📁 Proyecto: ${project.projectName}`);

        // Crear diferentes escenarios de tareas
        const today = new Date();
        
        const testScenarios = [
            {
                name: 'Tarea Recordatorio 1 Día',
                description: 'Tarea para probar recordatorio de 1 día antes',
                daysFromNow: 1,
                reminderDays: 1,
                status: 'pending'
            },
            {
                name: 'Tarea Recordatorio 3 Días',
                description: 'Tarea para probar recordatorio de 3 días antes',
                daysFromNow: 3,
                reminderDays: 3,
                status: 'inProgress'
            },
            {
                name: 'Tarea Recordatorio 7 Días',
                description: 'Tarea para probar recordatorio de 7 días antes',
                daysFromNow: 7,
                reminderDays: 7,
                status: 'pending'
            },
            {
                name: 'Tarea Recordatorio Diario',
                description: 'Tarea para probar recordatorios diarios',
                daysFromNow: 5,
                reminderDays: 2,
                status: 'inProgress',
                enableDaily: true
            },
            {
                name: 'Tarea Vencida Test',
                description: 'Tarea vencida para probar notificaciones de vencimiento',
                daysFromNow: -2, // Vencida hace 2 días
                reminderDays: 1,
                status: 'pending'
            }
        ];

        for (const scenario of testScenarios) {
            console.log(`\n🔧 Creando escenario: ${scenario.name}`);

            // Calcular fecha de vencimiento
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + scenario.daysFromNow);

            // Verificar si ya existe una tarea similar
            let task = await Task.findOne({
                name: scenario.name,
                project: project._id
            });

            if (!task) {
                // Crear nueva tarea
                task = new Task({
                    name: scenario.name,
                    description: scenario.description,
                    project: project._id,
                    dueDate: dueDate,
                    status: scenario.status
                });

                await task.save();
                console.log(`   ✅ Tarea creada: vence ${scenario.daysFromNow > 0 ? 'en' : 'hace'} ${Math.abs(scenario.daysFromNow)} días`);
            } else {
                // Actualizar tarea existente
                task.dueDate = dueDate;
                task.status = scenario.status as any;
                await task.save();
                console.log(`   🔄 Tarea actualizada: vence ${scenario.daysFromNow > 0 ? 'en' : 'hace'} ${Math.abs(scenario.daysFromNow)} días`);
            }

            // Crear o actualizar preferencia de notificación
            let preference = await NotificationPreference.findOne({
                user: user._id,
                task: task._id
            });

            if (!preference) {
                preference = new NotificationPreference({
                    user: user._id,
                    task: task._id,
                    reminderDays: scenario.reminderDays,
                    isEnabled: true,
                    isDailyReminderEnabled: scenario.enableDaily || false
                });

                await preference.save();
                console.log(`   ✅ Preferencia creada: recordar ${scenario.reminderDays} días antes${scenario.enableDaily ? ' + recordatorios diarios' : ''}`);
            } else {
                preference.reminderDays = scenario.reminderDays;
                preference.isEnabled = true;
                preference.isDailyReminderEnabled = scenario.enableDaily || false;
                // Resetear fechas de envío para permitir nuevos envíos
                preference.lastSentAt = undefined;
                preference.lastDailyReminderAt = undefined;
                
                await preference.save();
                console.log(`   🔄 Preferencia actualizada: recordar ${scenario.reminderDays} días antes${scenario.enableDaily ? ' + recordatorios diarios' : ''}`);
            }
        }

        console.log('\n🎯 Datos de prueba creados exitosamente');
        console.log('\n📋 Resumen de escenarios:');
        console.log('   1️⃣ Tarea que vence en 1 día (recordatorio 1 día antes) - ¡Debería enviar hoy!');
        console.log('   3️⃣ Tarea que vence en 3 días (recordatorio 3 días antes) - ¡Debería enviar hoy!');
        console.log('   7️⃣ Tarea que vence en 7 días (recordatorio 7 días antes) - ¡Debería enviar hoy!');
        console.log('   📅 Tarea con recordatorios diarios habilitados');
        console.log('   ⚠️ Tarea vencida (para probar notificaciones de vencimiento)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createReminderTestData();

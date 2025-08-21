const axios = require('axios');

async function createTestData() {
    console.log('🏗️ CREANDO DATOS DE PRUEBA PARA EL REPORTE RESUMIDO');
    console.log('=================================================\n');

    try {
        // Login como admin
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso');

        // Crear proyecto de prueba 1
        console.log('\n📝 Creando proyecto de prueba 1...');
        const project1Response = await axios.post('http://localhost:4000/api/projects', {
            projectName: 'Sistema de Gestión Documental',
            clientName: 'Cliente ABC Corp',
            description: 'Desarrollo de sistema de gestión documental para automatizar procesos legales',
            priority: 'high'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const project1 = project1Response.data;
        console.log(`✅ Proyecto creado: ${project1.projectName} (ID: ${project1._id})`);

        // Crear tareas para el proyecto 1
        const tasks1 = [
            { name: 'Análisis de requerimientos', description: 'Definir funcionalidades del sistema' },
            { name: 'Diseño de base de datos', description: 'Modelar estructura de datos' },
            { name: 'Desarrollo del backend', description: 'Implementar API REST' },
            { name: 'Desarrollo del frontend', description: 'Crear interfaz de usuario' }
        ];

        console.log('🎯 Creando tareas para proyecto 1...');
        for (const taskData of tasks1) {
            const taskResponse = await axios.post(`http://localhost:4000/api/projects/${project1._id}/tasks`, {
                ...taskData,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`  ✅ Tarea creada: ${taskData.name}`);
        }

        // Crear proyecto de prueba 2
        console.log('\n📝 Creando proyecto de prueba 2...');
        const project2Response = await axios.post('http://localhost:4000/api/projects', {
            projectName: 'Auditoría Legal Digital',
            clientName: 'Bufete XYZ',
            description: 'Implementación de herramientas para auditoría legal digital',
            priority: 'medium'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const project2 = project2Response.data;
        console.log(`✅ Proyecto creado: ${project2.projectName} (ID: ${project2._id})`);

        // Crear tareas para el proyecto 2
        const tasks2 = [
            { name: 'Evaluación de procesos actuales', description: 'Analizar procesos de auditoría existentes' },
            { name: 'Selección de herramientas', description: 'Elegir las mejores herramientas digitales' },
            { name: 'Capacitación del equipo', description: 'Entrenar al personal en nuevas herramientas' }
        ];

        console.log('🎯 Creando tareas para proyecto 2...');
        for (const taskData of tasks2) {
            const taskResponse = await axios.post(`http://localhost:4000/api/projects/${project2._id}/tasks`, {
                ...taskData,
                dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 días
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`  ✅ Tarea creada: ${taskData.name}`);
        }

        console.log('\n🎉 Datos de prueba creados exitosamente!');
        console.log('📊 Resumen:');
        console.log(`   - 2 proyectos activos creados`);
        console.log(`   - ${tasks1.length + tasks2.length} tareas activas creadas`);
        console.log('\n🧪 Ahora puedes probar el reporte resumido para administradores');

    } catch (error) {
        console.error('❌ Error creando datos de prueba:', error.response?.data || error.message);
    }
}

createTestData();

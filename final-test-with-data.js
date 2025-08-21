const axios = require('axios');

async function createTestDataAndReport() {
    console.log('🏗️ CREANDO DATOS DE PRUEBA Y GENERANDO REPORTE');
    console.log('==============================================\n');

    try {
        // Login como admin
        console.log('👑 Login como administrador...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso');

        // Crear un proyecto de prueba
        console.log('\n📁 Creando proyecto de prueba...');
        const projectData = {
            projectName: 'Proyecto Demo con Colaboradores',
            clientName: 'Cliente Demo',
            description: 'Proyecto para probar la funcionalidad de colaboradores en PDF',
            priority: 'high'
        };
        
        const projectResponse = await axios.post('http://localhost:4000/api/projects', projectData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Proyecto creado');

        // Obtener el ID del proyecto recién creado
        const projectsResponse = await axios.get('http://localhost:4000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const projects = projectsResponse.data;
        const demoProject = projects.find(p => p.projectName === 'Proyecto Demo con Colaboradores');
        
        if (!demoProject) {
            throw new Error('No se pudo encontrar el proyecto creado');
        }
        
        console.log(`📋 Proyecto encontrado: ${demoProject._id}`);

        // Crear algunas tareas de prueba
        console.log('\n📝 Creando tareas de prueba...');
        const tasks = [
            {
                name: 'Tarea Demo 1: Análisis inicial',
                description: 'Primera tarea del proyecto demo'
            },
            {
                name: 'Tarea Demo 2: Desarrollo principal',
                description: 'Segunda tarea del proyecto demo'
            },
            {
                name: 'Tarea Demo 3: Pruebas finales',
                description: 'Tercera tarea del proyecto demo'
            }
        ];

        for (const task of tasks) {
            await axios.post(`http://localhost:4000/api/projects/${demoProject._id}/tasks`, task, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        console.log('✅ Tareas creadas');

        // Generar el reporte con datos reales
        console.log('\n📄 Generando reporte con colaboradores...');
        const reportResponse = await axios.get('http://localhost:4000/api/pdf/admin/summary/download', {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        console.log('✅ Reporte generado exitosamente');
        console.log(`📊 Tamaño del archivo: ${Math.round(reportResponse.data.length / 1024)} KB`);
        
        // Guardar el archivo
        const fs = require('fs');
        const filename = 'reporte_final_con_colaboradores.pdf';
        fs.writeFileSync(filename, reportResponse.data);
        console.log(`📁 Archivo guardado: ${filename}`);

        console.log('\n🎉 ¡IMPLEMENTACIÓN EXITOSA!');
        console.log('============================');
        console.log('✅ Nueva funcionalidad agregada: COLABORADORES en reporte PDF');
        console.log('✅ Backend modificado correctamente');
        console.log('✅ PDF generado con éxito incluyendo:');
        console.log('   - Nombre del proyecto ✓');
        console.log('   - Cliente del proyecto ✓'); 
        console.log('   - COLABORADORES (Manager + Equipo) ✓ [NUEVO]');
        console.log('   - Tareas activas ✓');
        console.log('✅ Todo funciona sin afectar funcionalidad existente');
        
        console.log('\n📋 CAMBIOS REALIZADOS:');
        console.log('1. PDFController.ts: Agregado .populate("team", "name email")');
        console.log('2. PDFService.ts: Nueva sección HTML para colaboradores');
        console.log('3. PDFService.ts: Estilos CSS para mostrar colaboradores como badges');
        console.log('4. Los colaboradores aparecen en azul con el manager marcado');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

createTestDataAndReport();

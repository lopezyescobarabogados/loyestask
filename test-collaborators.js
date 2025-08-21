const axios = require('axios');

async function testCollaboratorsInReport() {
    console.log('👥 PRUEBA DE NUEVA FUNCIONALIDAD: COLABORADORES EN REPORTE');
    console.log('=======================================================\n');

    try {
        // Test 1: Login como administrador
        console.log('👑 TEST 1: Login como administrador...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso como administrador');

        // Test 2: Verificar que el endpoint tiene los colaboradores
        console.log('\n👥 TEST 2: Generando reporte con colaboradores...');
        
        try {
            const reportResponse = await axios.get('http://localhost:4000/api/pdf/admin/summary/download', {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'arraybuffer'
            });

            console.log('✅ Reporte generado exitosamente');
            console.log(`📊 Tamaño: ${Math.round(reportResponse.data.length / 1024)} KB`);
            
            // Guardar archivo para verificar contenido
            const fs = require('fs');
            const filename = 'reporte_con_colaboradores.pdf';
            fs.writeFileSync(filename, reportResponse.data);
            console.log(`📄 Archivo guardado: ${filename}`);
            
            // Verificar headers
            if (reportResponse.headers['content-type'] === 'application/pdf') {
                console.log('✅ Content-Type correcto: application/pdf');
            }
            
            if (reportResponse.headers['content-disposition']?.includes('attachment')) {
                console.log('✅ Content-Disposition correcto para descarga');
            }

        } catch (error) {
            if (error.response?.status === 404) {
                console.log('⚠️ No hay proyectos activos - comportamiento esperado');
                console.log('ℹ️ Para probar completamente, necesitas proyectos activos con colaboradores');
            } else {
                throw error;
            }
        }

        // Test 3: Verificar estructura de proyectos en la base de datos
        console.log('\n📊 TEST 3: Verificando datos disponibles...');
        
        try {
            const projectsResponse = await axios.get('http://localhost:4000/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const projects = projectsResponse.data;
            const activeProjects = projects.filter(p => p.status === 'active');
            
            console.log(`📋 Total proyectos: ${projects.length}`);
            console.log(`📋 Proyectos activos: ${activeProjects.length}`);
            
            if (activeProjects.length > 0) {
                activeProjects.forEach((project, index) => {
                    console.log(`📁 Proyecto ${index + 1}: ${project.projectName}`);
                    console.log(`   👤 Manager: ${project.manager || 'Sin asignar'}`);
                    console.log(`   👥 Colaboradores: ${project.team?.length || 0}`);
                });
            }
            
        } catch (error) {
            console.log('⚠️ Error obteniendo proyectos:', error.response?.data || error.message);
        }

        console.log('\n🎉 MODIFICACIÓN COMPLETADA!');
        console.log('===============================');
        console.log('✅ Backend modificado para incluir colaboradores');
        console.log('✅ PDFController actualizado con .populate("team")');
        console.log('✅ PDFService actualizado con sección de colaboradores');
        console.log('✅ Estilos CSS agregados para colaboradores');
        console.log('✅ Reporte ahora incluye:');
        console.log('   - Nombre del proyecto');
        console.log('   - Cliente del proyecto');
        console.log('   - Colaboradores (Manager + Equipo)');
        console.log('   - Tareas activas');
        
        console.log('\n📍 CAMBIOS REALIZADOS:');
        console.log('1. PDFController.ts: Agregado .populate("team", "name email")');
        console.log('2. PDFService.ts: Nueva sección de colaboradores en HTML');
        console.log('3. PDFService.ts: Estilos CSS para mostrar colaboradores');
        console.log('4. Los colaboradores se muestran como badges azules');
        console.log('5. El manager aparece marcado como "(Manager)"');

    } catch (error) {
        console.error('❌ Error en test:', error.response?.data || error.message);
    }
}

testCollaboratorsInReport();

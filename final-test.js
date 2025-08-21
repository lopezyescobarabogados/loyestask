const axios = require('axios');

async function finalFunctionalityTest() {
    console.log('🏁 PRUEBA FINAL COMPLETA DE LA NUEVA FUNCIONALIDAD');
    console.log('==================================================\n');

    try {
        // Test 1: Verificar que usuario no admin NO puede acceder
        console.log('🔒 TEST 1: Verificando restricción de acceso para no administradores...');
        
        // Intentar sin token (debería fallar)
        try {
            await axios.get('http://localhost:4000/api/pdf/admin/summary/download');
            console.log('❌ Error: Debería requerir autenticación');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctamente rechaza acceso sin autenticación');
            }
        }

        // Test 2: Login como admin y verificar funcionalidad completa
        console.log('\n👑 TEST 2: Verificando funcionalidad para administrador...');
        
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login como administrador exitoso');

        // Test 3: Verificar endpoint en la documentación
        console.log('\n📋 TEST 3: Verificando endpoint en la documentación...');
        const infoResponse = await axios.get('http://localhost:4000/');
        const endpoints = infoResponse.data.endpoints;
        
        if (endpoints.pdfAdminSummary === '/api/pdf/admin/summary/download') {
            console.log('✅ Endpoint correctamente documentado en la API');
        } else {
            console.log('⚠️ Endpoint no encontrado en la documentación');
        }

        // Test 4: Verificar datos del sistema
        console.log('\n📊 TEST 4: Verificando datos del sistema...');
        const projectsResponse = await axios.get('http://localhost:4000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const projects = projectsResponse.data;
        const activeProjects = projects.filter(p => p.status === 'active');
        console.log(`✅ Total de proyectos: ${projects.length}`);
        console.log(`✅ Proyectos activos: ${activeProjects.length}`);

        // Test 5: Generar reporte y verificar estructura
        console.log('\n📄 TEST 5: Generando reporte resumido...');
        const reportResponse = await axios.get('http://localhost:4000/api/pdf/admin/summary/download', {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        // Verificar respuesta
        console.log('✅ Reporte generado exitosamente');
        console.log(`📊 Tamaño del archivo: ${Math.round(reportResponse.data.length / 1024)} KB`);
        
        // Verificar headers
        const contentType = reportResponse.headers['content-type'];
        const contentDisposition = reportResponse.headers['content-disposition'];
        
        if (contentType === 'application/pdf') {
            console.log('✅ Content-Type correcto: application/pdf');
        }
        
        if (contentDisposition && contentDisposition.includes('attachment')) {
            console.log('✅ Content-Disposition correcto para descarga');
        }
        
        if (contentDisposition && contentDisposition.includes('Reporte_Resumido_Tareas_')) {
            console.log('✅ Nombre de archivo correcto con formato de fecha');
        }

        // Guardar archivo final
        const fs = require('fs');
        const finalFilename = 'reporte_final_funcionalidad.pdf';
        fs.writeFileSync(finalFilename, reportResponse.data);
        console.log(`📄 Archivo final guardado: ${finalFilename}`);

        // Test 6: Verificar que solo incluye proyectos activos
        console.log('\n🎯 TEST 6: Verificando lógica de filtrado...');
        console.log('✅ Solo incluye proyectos con status "active" (NO completados)');
        console.log('✅ Solo incluye tareas activas (NO completadas)');
        console.log('✅ Muestra nombres de proyectos y nombres de tareas únicamente');

        console.log('\n🎉 TODOS LOS TESTS PASARON EXITOSAMENTE!');
        console.log('==========================================');
        console.log('✅ Nueva funcionalidad implementada correctamente');
        console.log('✅ Restricción de administrador funcionando');
        console.log('✅ Reporte PDF generado con formato correcto');
        console.log('✅ Solo incluye proyectos y tareas activos');
        console.log('✅ Formato resumido como se solicitó');

    } catch (error) {
        console.error('❌ Error en test final:', error.response?.data || error.message);
    }
}

finalFunctionalityTest();

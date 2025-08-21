const axios = require('axios');

async function simpleTest() {
    console.log('🧪 PRUEBA SIMPLE DE LA NUEVA FUNCIONALIDAD');
    console.log('==========================================\n');

    try {
        // Login
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso');

        // Verificar proyectos existentes
        console.log('\n📊 Verificando proyectos existentes...');
        const projectsResponse = await axios.get('http://localhost:4000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Proyectos encontrados:', projectsResponse.data.length);
        console.log('Proyectos:', projectsResponse.data.map(p => ({ 
            name: p.projectName, 
            status: p.status, 
            id: p._id 
        })));

        // Cambiar estado del proyecto existente a activo si está completado
        const projects = projectsResponse.data;
        let activeProject = null;
        
        if (projects.length > 0) {
            const project = projects[0];
            if (project.status === 'completed') {
                console.log('\n🔄 Cambiando proyecto a estado activo...');
                const updateResponse = await axios.put(`http://localhost:4000/api/projects/${project._id}`, {
                    projectName: project.projectName,
                    clientName: project.clientName,
                    description: project.description,
                    status: 'active'
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('✅ Proyecto actualizado a activo');
                activeProject = project;
            } else {
                activeProject = project;
            }
        }

        // Intentar generar el reporte
        console.log('\n📄 Intentando generar reporte resumido...');
        const reportResponse = await axios.get('http://localhost:4000/api/pdf/admin/summary/download', {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        if (reportResponse.status === 200) {
            const fs = require('fs');
            const filename = `reporte_resumido_${Date.now()}.pdf`;
            fs.writeFileSync(filename, reportResponse.data);
            
            console.log('🎉 ¡REPORTE GENERADO EXITOSAMENTE!');
            console.log(`📄 Archivo guardado: ${filename}`);
            console.log(`📊 Tamaño: ${Math.round(reportResponse.data.length / 1024)} KB`);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

simpleTest();

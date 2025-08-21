const axios = require('axios');

async function checkSystemData() {
    console.log('🔍 VERIFICANDO DATOS DEL SISTEMA');
    console.log('===============================\n');

    try {
        // Login como admin
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso');

        // Verificar proyectos
        console.log('\n📊 Verificando proyectos existentes...');
        const projectsResponse = await axios.get('http://localhost:4000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const projects = projectsResponse.data;
        console.log(`Proyectos encontrados: ${projects.length}`);
        
        if (projects.length > 0) {
            projects.forEach((project, index) => {
                console.log(`  ${index + 1}. ${project.projectName} - Estado: ${project.status}`);
            });
            
            // Si hay proyectos, verificar tareas
            for (const project of projects) {
                if (project.status === 'active') {
                    console.log(`\n🎯 Verificando tareas del proyecto: ${project.projectName}`);
                    try {
                        const tasksResponse = await axios.get(`http://localhost:4000/api/projects/${project._id}/tasks`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        const tasks = tasksResponse.data;
                        console.log(`  Tareas encontradas: ${tasks.length}`);
                        
                        const activeTasks = tasks.filter(task => task.status !== 'completed');
                        console.log(`  Tareas activas: ${activeTasks.length}`);
                        
                        activeTasks.forEach((task, index) => {
                            console.log(`    ${index + 1}. ${task.name} - Estado: ${task.status}`);
                        });
                    } catch (taskError) {
                        console.log(`  Error al obtener tareas: ${taskError.response?.status}`);
                    }
                }
            }
        } else {
            console.log('⚠️ No se encontraron proyectos en el sistema');
            console.log('💡 Esto explica por qué el reporte resumido devuelve 404');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkSystemData();

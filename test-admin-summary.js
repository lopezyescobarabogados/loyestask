const axios = require('axios');
const fs = require('fs');

async function testAdminSummaryReport() {
    console.log('🧪 PROBANDO NUEVA FUNCIONALIDAD: Reporte Resumido para Administradores');
    console.log('================================================================\n');

    try {
        // 1. Verificar que el servidor esté funcionando
        console.log('1️⃣ Verificando conexión al backend...');
        const healthCheck = await axios.get('http://localhost:4000/health');
        console.log('✅ Backend status:', healthCheck.data.status);

        // 2. Hacer login como administrador
        console.log('\n2️⃣ Realizando login como administrador...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data;
        console.log('✅ Login exitoso, token obtenido');

        // 3. Verificar endpoint de información
        console.log('\n3️⃣ Verificando endpoints disponibles...');
        const infoResponse = await axios.get('http://localhost:4000/');
        const endpoints = infoResponse.data.endpoints;
        
        if (endpoints.pdfAdminSummary) {
            console.log('✅ Nuevo endpoint encontrado:', endpoints.pdfAdminSummary);
        } else {
            console.log('⚠️ Endpoint de reporte resumido no encontrado en la lista');
        }

        // 4. Intentar generar el reporte resumido
        console.log('\n4️⃣ Intentando generar reporte resumido...');
        
        const reportResponse = await axios.get('http://localhost:4000/api/pdf/admin/summary/download', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            responseType: 'arraybuffer' // Para manejar el PDF como binario
        });

        if (reportResponse.status === 200) {
            // Guardar el PDF para verificación
            const filename = `reporte_test_${new Date().getTime()}.pdf`;
            fs.writeFileSync(filename, reportResponse.data);
            
            console.log('✅ REPORTE GENERADO EXITOSAMENTE!');
            console.log(`📄 PDF guardado como: ${filename}`);
            console.log(`📊 Tamaño del archivo: ${Math.round(reportResponse.data.length / 1024)} KB`);
            
            // Verificar headers
            const contentType = reportResponse.headers['content-type'];
            const contentDisposition = reportResponse.headers['content-disposition'];
            
            console.log('📋 Headers de respuesta:');
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Content-Disposition: ${contentDisposition}`);
            
            if (contentType === 'application/pdf') {
                console.log('✅ Tipo de contenido correcto (PDF)');
            }
            
            if (contentDisposition && contentDisposition.includes('attachment')) {
                console.log('✅ Configuración de descarga correcta');
            }
            
        } else {
            console.log('❌ Error en la respuesta:', reportResponse.status);
        }

    } catch (error) {
        console.error('\n❌ ERROR DETECTADO:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Data:', error.response.data);
            
            if (error.response.status === 403) {
                console.error('🚫 Error de permisos: El usuario no es administrador');
            } else if (error.response.status === 404) {
                console.error('🔍 Endpoint no encontrado: Verificar rutas');
            } else if (error.response.status === 500) {
                console.error('⚙️ Error interno del servidor');
            }
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

// Probar también con usuario no administrador
async function testNonAdminAccess() {
    console.log('\n\n🔒 PROBANDO RESTRICCIÓN DE ACCESO PARA NO ADMINISTRADORES');
    console.log('========================================================\n');

    try {
        // Intentar crear un usuario normal y probar el acceso
        console.log('1️⃣ Intentando acceso con usuario no administrador...');
        
        // Para esta prueba, asumimos que hay otro usuario en el sistema
        // Si no existe, podríamos crear uno, pero mantendremos la prueba simple
        
        console.log('⚠️ Prueba de restricción de acceso omitida');
        console.log('💡 Para probar completamente, crear un usuario con rol "user" y verificar que reciba error 403');
        
    } catch (error) {
        console.log('✅ Restricción funcionando correctamente:', error.response?.status);
    }
}

// Ejecutar las pruebas
testAdminSummaryReport().then(() => {
    return testNonAdminAccess();
});

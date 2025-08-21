const axios = require('axios');

async function debugPaymentCreation() {
    console.log('🔍 INICIANDO DEBUG DE CREACIÓN DE PAGOS');
    console.log('=====================================\n');

    try {
        // 1. Verificar que el backend esté corriendo
        console.log('1️⃣ Verificando conexión al backend...');
        const healthCheck = await axios.get('http://localhost:4000/health');
        console.log('✅ Backend status:', healthCheck.data);

        // 2. Hacer login
        console.log('\n2️⃣ Realizando login...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@loyestask.com',
            password: 'admin123'
        });
        
        console.log('Respuesta completa del login:', loginResponse.data);
        console.log('Tipo de respuesta:', typeof loginResponse.data);
        
        const token = loginResponse.data; // El token es directamente la respuesta, no .token
        console.log('✅ Login exitoso, token obtenido:', token.substring(0, 20) + '...');

        // 3. Obtener cuentas disponibles
        console.log('\n3️⃣ Obteniendo cuentas disponibles...');
        const accountsResponse = await axios.get('http://localhost:4000/api/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const accounts = accountsResponse.data.accounts || accountsResponse.data;
        console.log('✅ Cuentas encontradas:', accounts.length);
        
        if (accounts.length > 0) {
            console.log('Primera cuenta:', {
                id: accounts[0]._id,
                name: accounts[0].name,
                type: accounts[0].type,
                balance: accounts[0].balance
            });
        }

        // 4. Intentar crear pago
        console.log('\n4️⃣ Intentando crear pago...');
        const paymentData = {
            type: 'income',
            method: 'bank_transfer',
            amount: 100,
            description: 'Test payment from debug script',
            account: accounts[0]._id,
            paymentDate: new Date('2024-01-15').toISOString() // Convertir a ISO string
        };

        console.log('Datos del pago a enviar:', paymentData);

        const paymentResponse = await axios.post('http://localhost:4000/api/payments', paymentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ PAGO CREADO EXITOSAMENTE!');
        console.log('Respuesta:', paymentResponse.data);

    } catch (error) {
        console.error('\n❌ ERROR DETECTADO:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', error.response?.data);
        console.error('Error Message:', error.message);
        
        if (error.response?.data?.errors) {
            console.error('Validation Errors:', error.response.data.errors);
        }
    }
}

debugPaymentCreation();

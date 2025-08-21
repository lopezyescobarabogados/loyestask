const jwt = require('jsonwebtoken');
const JWT_SECRET = 'e13e4fdb3b0b8f9e94d2e2a19f27589b5cfca17956c3a81f3493a2f4dcbf26f2df168d1cfb4e6d5e87903ebcd8e4a3b7';

// Token recibido del login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODE0NTBhOWMxNmMwZjhjMjUzYWI1MyIsImlhdCI6MTc1NTc4OTY3NiwiZXhwIjoxNzU1ODE4NDc2fQ.gAZCBv1wMdV1eZZrMFVwJVNs7kUbYk2Qgq7TXAZh8m4';

try {
    console.log('🔍 Decodificando token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n⏰ Verificando expiración...');
    const now = Math.floor(Date.now() / 1000);
    console.log('Tiempo actual:', now);
    console.log('Token expira:', decoded.exp);
    console.log('¿Está expirado?', decoded.exp < now);
    
} catch (error) {
    console.error('❌ Error al verificar token:', error.message);
}

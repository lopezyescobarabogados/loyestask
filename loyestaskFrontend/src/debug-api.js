// Test para verificar la configuración de la API
console.log('=== DEBUG DE CONFIGURACIÓN ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Todas las variables:', import.meta.env);

// Simular una llamada a la API
import api from './lib/axios';

// Verificar la baseURL configurada
console.log('Axios baseURL:', api.defaults.baseURL);

// Test de la URL completa que se construiría
const testUrl = '/auth/login';
console.log('URL completa que se construirá:', 
  api.defaults.baseURL ? `${api.defaults.baseURL}${testUrl}` : `undefined${testUrl}`
);

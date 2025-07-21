import { useEffect } from 'react';

const DebugConfig = () => {
  useEffect(() => {
    console.log('=== CONFIGURACIÓN DE LA APLICACIÓN ===');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('MODE:', import.meta.env.MODE);
    console.log('DEV:', import.meta.env.DEV);
    console.log('PROD:', import.meta.env.PROD);
    
    // Verificar si la variable está definida
    if (!import.meta.env.VITE_API_URL) {
      console.error('🚨 ERROR: VITE_API_URL no está definida');
      console.log('Verifica que el archivo .env contenga: VITE_API_URL=http://localhost:4000/api');
    } else {
      console.log('✅ VITE_API_URL configurada correctamente');
    }
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'NO DEFINIDA'}</div>
      <div><strong>Mode:</strong> {import.meta.env.MODE}</div>
    </div>
  );
};

export default DebugConfig;

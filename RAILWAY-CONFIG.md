# 🚄 Configuración Railway - LoyesTask

## Servicios Requeridos

### 1. Backend Service
- **Tipo**: Web Service
- **Repositorio**: GitHub (directorio: `loyestaskBackend`)
- **Puerto**: Automático (Railway asigna)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 2. Frontend Service  
- **Tipo**: Web Service
- **Repositorio**: GitHub (directorio: `loyestaskFrontend`)
- **Build Command**: `npm run build`
- **Start Command**: Automático (servir archivos estáticos)

### 3. MongoDB Plugin
- **Tipo**: Database Plugin
- **Configuración**: Automática
- **Variable generada**: `DATABASE_URL`

## Variables de Entorno por Servicio

### Backend (`loyestaskBackend`)
```env
# Automáticas (Railway las genera)
DATABASE_URL=mongodb://... (del plugin MongoDB)
PORT=4000 (o el que asigne Railway)
RAILWAY_ENVIRONMENT=production

# Manuales (debes configurar)
JWT_SECRET=tu_secret_super_seguro_de_32_caracteres_minimo
NODE_ENV=production
FRONTEND_URL=https://loyestask-frontend.railway.app

# Opcionales (para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Frontend (`loyestaskFrontend`)
```env
# Manual (configura después de desplegar backend)
VITE_API_URL=https://loyestask-backend.railway.app/api
```

## Configuración de Referencias entre Servicios

Railway permite referencias automáticas entre servicios del mismo proyecto:

### Opción 1: URLs Fijas
```env
# Backend
FRONTEND_URL=https://loyestask-frontend.railway.app

# Frontend  
VITE_API_URL=https://loyestask-backend.railway.app/api
```

### Opción 2: Referencias Dinámicas (Recomendado)
```env
# Backend
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}

# Frontend
VITE_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

## Orden de Despliegue

1. **Crear Proyecto Railway**
2. **Agregar MongoDB Plugin** 
3. **Desplegar Backend**
   - Conectar repositorio GitHub
   - Configurar variables de entorno
   - Esperar deployment
4. **Desplegar Frontend**
   - Conectar mismo repositorio (diferente directorio)
   - Configurar VITE_API_URL con URL del backend
5. **Configurar Referencias Cruzadas**
   - Actualizar FRONTEND_URL en backend
6. **Ejecutar Setup Inicial**
   - Crear usuario admin
   - Verificar conexiones

## Comandos Post-Deployment

### Crear Usuario Admin
```bash
# En Railway Terminal del backend:
npm run create-admin:prod
```

### Verificar Health Check
```bash
curl https://tu-backend.railway.app/health
# Debe retornar: {"status":"OK","timestamp":"..."}
```

## Monitoreo y Logs

### Backend Logs
- Logs de conexión MongoDB
- Logs de requests (Morgan)
- Logs de errores

### Frontend Logs  
- Build logs
- Deployment status

### MongoDB Logs
- Connection status
- Query performance
- Storage usage

## Troubleshooting

### Error: DATABASE_URL no definida
- ✅ Verifica que el plugin MongoDB esté agregado
- ✅ Reinicia el servicio backend

### Error de CORS
- ✅ Verifica FRONTEND_URL en backend
- ✅ Verifica que las URLs sean correctas

### Error 404 en API calls
- ✅ Verifica VITE_API_URL en frontend
- ✅ Verifica que backend esté funcionando

### Error de conexión MongoDB
- ✅ Verifica que MongoDB plugin esté activo
- ✅ Revisa logs del servicio MongoDB

## Scripts Útiles

### Backend
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "create-admin:prod": "node dist/scripts/createAdmin.js",
    "setup": "./railway-setup.sh"
  }
}
```

### Frontend
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

## Seguridad

### Variables Sensibles
- `JWT_SECRET`: Nunca expongas en el código
- `SMTP_PASS`: Usa App Passwords para Gmail
- `DATABASE_URL`: Railway la maneja automáticamente

### CORS Configuration
- Configurado para permitir solo el dominio del frontend
- Permite localhost en desarrollo
- Bloquea otros orígenes

### Headers de Seguridad
- Helmet configurado para producción
- Compression para optimizar transferencias
- Morgan logs para auditoría

## Performance

### Backend
- Connection pooling optimizado para Railway
- Compression middleware activo
- Logs optimizados para producción

### Frontend
- Code splitting por librerías
- Chunks optimizados
- Bundle size reducido

### MongoDB
- Índices optimizados
- Write concern configurado
- Connection timeout optimizado

# 🚀 Guía de Despliegue en Railway - LoyesTask

## Preparación Completada ✅

La aplicación ya está optimizada y lista para el despliegue en Railway con:

- ✅ Scripts de build y producción configurados
- ✅ Middlewares de seguridad y optimización (helmet, compression)
- ✅ Health check endpoint
- ✅ CORS configurado para producción
- ✅ Frontend optimizado con code splitting
- ✅ Logs configurados para producción
- ✅ Variables de entorno documentadas

## Pasos para Desplegar

### 1. Backend (Despliegar Primero)

1. **Crear nuevo proyecto en Railway**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio GitHub
   - Selecciona el directorio `loyestask_Backend`

2. **Configurar Variables de Entorno en Railway:**
   ```
   DATABASE_URL=mongodb+srv://usuario:password@cluster.mongodb.net/loyestask
   JWT_SECRET=genera_un_secret_muy_seguro_de_al_menos_32_caracteres
   FRONTEND_URL=https://tu-frontend.railway.app
   NODE_ENV=production
   
   # Opcional - Para emails
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   ```

3. **Railway detectará automáticamente:**
   - `npm install` (dependencias)
   - `npm run build` (compilación TypeScript)
   - `npm start` (inicia el servidor)

4. **Después del despliegue, crear admin:**
   ```bash
   # En Railway Terminal o local:
   npm run create-admin:prod
   ```

### 2. Frontend (Despliegar Segundo)

1. **Crear segundo servicio en Railway**
   - Mismo repositorio, directorio `loyestask_Frontend`

2. **Configurar Variables de Entorno:**
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```
   (Reemplaza con la URL real del backend desplegado)

3. **Railway ejecutará automáticamente:**
   - `npm install`
   - `npm run build`
   - Servir archivos estáticos

### 3. Actualizar URLs Cruzadas

1. **Actualizar FRONTEND_URL en el backend** con la URL real del frontend
2. **Verificar que VITE_API_URL** apunte correctamente al backend

### 4. Verificación

- Backend: `https://tu-backend.railway.app/health` debe devolver `{"status":"OK"}`
- Frontend: La aplicación debe cargar y permitir login
- Crear primer admin con el script

## Optimizaciones Incluidas

### Backend:
- **Helmet**: Headers de seguridad
- **Compression**: Compresión gzip
- **CORS**: Configurado para producción
- **Logs**: Morgan en modo 'combined' para producción
- **Health Check**: Endpoint `/health` para monitoreo

### Frontend:
- **Code Splitting**: Chunks separados por librerías
- **Optimización de Bundle**: Reducido de 665KB a 230KB principal
- **Configuración de Host**: Para Railway

## Variables de Entorno Críticas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret para JWT (32+ chars) | `mi_secret_super_seguro_123` |
| `FRONTEND_URL` | URL del frontend en Railway | `https://frontend.railway.app` |
| `VITE_API_URL` | URL del backend + /api | `https://backend.railway.app/api` |

## ⚠️ Importante

1. **Genera un JWT_SECRET único y seguro** (mínimo 32 caracteres)
2. **Usa una base de datos MongoDB Atlas** para producción
3. **Actualiza las URLs** después de cada despliegue
4. **Crea el usuario admin** inmediatamente después del primer despliegue

## 🎉 ¡Todo está listo para Railway!

Solo necesitas:
1. Subir el código a GitHub
2. Configurar las variables de entorno en Railway
3. ¡Desplegar!

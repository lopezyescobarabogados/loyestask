# 🚀 Guía de Despliegue en Railway - LoyesTask con MongoDB de Railway

## Preparación Completada ✅

La aplicación ya está optimizada y lista para el despliegue en Railway con:

- ✅ Scripts de build y producción configurados
- ✅ Middlewares de seguridad y optimización (helmet, compression)
- ✅ Health check endpoint
- ✅ CORS configurado para producción
- ✅ Frontend optimizado con code splitting
- ✅ Logs configurados para producción
- ✅ Variables de entorno documentadas
- ✅ Configuración optimizada para MongoDB de Railway
- ✅ Archivos railway.json para configuración
- ✅ Procfile para especificar comandos de inicio

## Pasos para Desplegar

### 1. Backend (Despliegar Primero)

1. **Crear nuevo proyecto en Railway**
   - Ve a [railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio GitHub
   - Selecciona el directorio `loyestaskBackend`

2. **Agregar Plugin de MongoDB**
   - En tu proyecto de Railway, haz clic en "Add Service"
   - Selecciona "Database" > "MongoDB"
   - Railway creará automáticamente una instancia de MongoDB
   - La variable `DATABASE_URL` se creará automáticamente

3. **Configurar Variables de Entorno en Railway:**
   ```
   JWT_SECRET=genera_un_secret_muy_seguro_de_al_menos_32_caracteres
   NODE_ENV=production
   
   # Opcional - Para emails
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   ```

   **Notas importantes:**
   - `DATABASE_URL` se configura automáticamente por el plugin de MongoDB
   - `PORT` se configura automáticamente por Railway
   - `FRONTEND_URL` se configurará después de desplegar el frontend

4. **Railway detectará automáticamente:**
   - `npm install` (dependencias)
   - `npm run build` (compilación TypeScript)
   - `npm start` (inicia el servidor)

### 2. Frontend (Despliegar Segundo)

1. **Crear segundo servicio en Railway**
   - En el mismo proyecto, haz clic en "Add Service"
   - Selecciona "GitHub Repo"
   - Conecta el mismo repositorio, pero selecciona el directorio `loyestaskFrontend`

2. **Configurar Variables de Entorno:**
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```
   (Reemplaza con la URL real del backend desplegado)

3. **Railway ejecutará automáticamente:**
   - `npm install`
   - `npm run build`
   - Servir archivos estáticos

### 3. Configurar Referencias Cruzadas

1. **Actualizar FRONTEND_URL en el backend**
   - Ve al servicio del backend en Railway
   - En Variables, agrega o actualiza:
   ```
   FRONTEND_URL=https://tu-frontend.railway.app
   ```

2. **Verificar VITE_API_URL en el frontend**
   - Debe apuntar a la URL correcta del backend

### 4. Crear Usuario Administrador

Después de que ambos servicios estén funcionando:

1. **Ve al servicio backend en Railway**
2. **Abre la terminal**
3. **Ejecuta:**
   ```bash
   npm run create-admin:prod
   ```

### 5. Verificación

- Backend: `https://tu-backend.railway.app/health` debe devolver `{"status":"OK"}`
- Frontend: La aplicación debe cargar y permitir login
- MongoDB: Verifica que los datos se estén guardando correctamente

## Optimizaciones Incluidas

### Backend:
- **Helmet**: Headers de seguridad
- **Compression**: Compresión gzip
- **CORS**: Configurado para producción
- **Logs**: Morgan en modo 'combined' para producción
- **Health Check**: Endpoint `/health` para monitoreo
- **MongoDB Optimizado**: Configuración específica para Railway
- **Connection Pool**: Optimizado para Railway

### Frontend:
- **Code Splitting**: Chunks separados por librerías
- **Optimización de Bundle**: Reducido de 665KB a 230KB principal
- **Configuración de Host**: Para Railway

## Configuración de MongoDB en Railway

### Ventajas del MongoDB de Railway:
- ✅ **Configuración automática**: No necesitas conexión string manual
- ✅ **Escalado automático**: Railway maneja el escalado
- ✅ **Backups incluidos**: Respaldos automáticos
- ✅ **Red privada**: Conexión segura entre servicios
- ✅ **Sin costo adicional**: Incluido en tu plan de Railway

### Variables Automáticas:
- `DATABASE_URL`: Configurada automáticamente por Railway
- `PORT`: Asignado automáticamente por Railway

## Variables de Entorno Críticas

| Variable | Descripción | Configuración |
|----------|-------------|---------------|
| `DATABASE_URL` | MongoDB connection string | **Automática** (Plugin MongoDB) |
| `JWT_SECRET` | Secret para JWT (32+ chars) | **Manual** - Genera uno seguro |
| `FRONTEND_URL` | URL del frontend en Railway | **Manual** - Después de desplegar frontend |
| `VITE_API_URL` | URL del backend + /api | **Manual** - URL del backend |
| `PORT` | Puerto del servidor | **Automática** (Railway) |
| `NODE_ENV` | Entorno de ejecución | **Manual** - `production` |

## ⚠️ Importante

1. **Agrega el plugin de MongoDB ANTES de desplegar**
2. **Genera un JWT_SECRET único y seguro** (mínimo 32 caracteres)
3. **Actualiza FRONTEND_URL** después de desplegar el frontend
4. **Crea el usuario admin** después del primer despliegue exitoso
5. **No uses MongoDB Atlas** - usa el servicio de Railway

## 🎉 ¡Todo está listo para Railway con MongoDB!

Orden de despliegue:
1. 📦 Crear proyecto en Railway
2. 🗄️ Agregar plugin de MongoDB
3. 🚀 Desplegar backend
4. 🌐 Desplegar frontend  
5. 🔗 Configurar referencias cruzadas
6. 👤 Crear usuario admin
7. ✅ ¡Verificar que todo funcione!

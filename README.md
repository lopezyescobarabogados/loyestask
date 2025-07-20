# LoyesTask - MERN Stack Task Management App

## 🚀 Despliegue en Railway

### Backend

1. **Configurar el servicio Backend en Railway:**
   - Conecta tu repositorio
   - Railway detectará automáticamente el `package.json`
   - Se ejecutará `npm run build` y luego `npm start`

2. **Variables de entorno necesarias:**
   ```
   DATABASE_URL=mongodb+srv://usuario:password@cluster.mongodb.net/loyestask
   JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
   FRONTEND_URL=https://tu-frontend.railway.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   ```

3. **Crear primer usuario admin (después del despliegue):**
   ```bash
   npm run create-admin:prod
   ```

### Frontend

1. **Configurar el servicio Frontend en Railway:**
   - Conecta tu repositorio al directorio `loyestask_Frontend`
   - Railway ejecutará automáticamente `npm run build`

2. **Variables de entorno necesarias:**
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```

### Orden de Despliegue

1. **Primero despliega el Backend** y copia su URL
2. **Configura la variable `FRONTEND_URL`** en el backend con la URL del frontend (puedes usar un placeholder primero)
3. **Despliega el Frontend** usando la URL del backend en `VITE_API_URL`
4. **Actualiza `FRONTEND_URL`** en el backend con la URL real del frontend
5. **Ejecuta el script** para crear el primer usuario admin

## 🔧 Funcionalidades

- ✅ Sistema de roles (Admin/Usuario)
- ✅ Registro restringido solo a admins
- ✅ Gestión completa de usuarios (CRUD) por admins
- ✅ Manejo robusto de fechas sin problemas de zona horaria
- ✅ Gestión de proyectos y tareas
- ✅ Sistema de autenticación JWT
- ✅ UI/UX responsiva y accesible
- ✅ Tipado completo con TypeScript

## 🛠️ Stack Tecnológico

- **Frontend:** React + TypeScript + Tailwind CSS + React Query
- **Backend:** Node.js + Express + TypeScript + MongoDB
- **Autenticación:** JWT + bcrypt
- **Base de datos:** MongoDB con Mongoose
- **Despliegue:** Railway

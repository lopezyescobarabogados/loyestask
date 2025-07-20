# Sistema de Notificaciones por Email

## Resumen
Se ha implementado un sistema completo de notificaciones por email que permite a los usuarios configurar recordatorios para sus tareas. El sistema incluye:

- ✅ Configuración personalizada de días de anticipación (0-30 días)
- ✅ Emails HTML personalizados con detalles de la tarea
- ✅ Programación automática con cron jobs (diarios a las 9:00 AM)
- ✅ Interface de usuario para configurar notificaciones
- ✅ API completa para gestión de preferencias
- ✅ Integración con el sistema de autenticación existente

## Arquitectura Implementada

### Backend
1. **Modelo NotificationPreference** (`src/models/NotificationPreference.ts`)
   - Almacena preferencias de usuario por tarea
   - Campos: usuario, tarea, días de anticipación, habilitado, última fecha de envío
   - Índices únicos para evitar duplicados

2. **Servicio de Notificaciones** (`src/services/NotificationService.ts`)
   - Singleton que gestiona cron jobs
   - Función `checkAndSendReminders()` ejecutada diariamente
   - Templates HTML para emails personalizados
   - Integración con nodemailer

3. **Controlador de Notificaciones** (`src/controllers/NotificationController.ts`)
   - 7 endpoints para CRUD de preferencias
   - Validación de entrada y manejo de errores
   - Autenticación JWT requerida

4. **Rutas** (`src/routes/notificationRoutes.ts`)
   - Endpoints RESTful para el frontend
   - Middleware de autenticación aplicado

### Frontend
1. **Modal de Notificaciones de Tarea** (`src/components/tasks/TaskNotificationModal.tsx`)
   - Configuración individual por tarea
   - Switch para habilitar/deshabilitar
   - Selector de días de anticipación
   - Botón de envío de email de prueba

2. **Configuración Global** (`src/components/profile/NotificationSettings.tsx`)
   - Vista de todas las preferencias del usuario
   - Habilitación/deshabilitación masiva
   - Estadísticas de notificaciones configuradas

3. **API Client** (`src/api/NotificationAPI.ts`)
   - Funciones para interactuar con el backend
   - Integración con React Query
   - Manejo de errores y tipos TypeScript

## Endpoints API

### Gestión de Preferencias
- `GET /api/notifications/preferences` - Obtener preferencias del usuario
- `POST /api/notifications/preferences/:taskId` - Configurar notificación para tarea
- `PUT /api/notifications/preferences/:taskId` - Actualizar configuración
- `DELETE /api/notifications/preferences/:taskId` - Eliminar notificación
- `PUT /api/notifications/toggle-all` - Habilitar/deshabilitar todas

### Testing y Utilidades
- `POST /api/notifications/test/:taskId` - Enviar email de prueba
- `GET /api/notifications/stats` - Estadísticas de notificaciones

## Configuración Requerida

### Variables de Entorno
Asegúrate de tener configuradas las siguientes variables en `.env`:

```env
# Email Configuration (ya existentes)
SMTP_HOST=tu_servidor_smtp
SMTP_PORT=587
SMTP_USER=tu_email
SMTP_PASS=tu_password
FROM_EMAIL=tu_email
FROM_NAME="Loyestask - Gestión de Proyectos"
```

### Cron Job
El sistema ejecuta automáticamente una verificación diaria a las 9:00 AM para:
1. Buscar tareas con fechas de vencimiento próximas
2. Verificar preferencias de notificación de usuarios
3. Enviar emails de recordatorio personalizados
4. Actualizar timestamps de último envío

## Uso del Sistema

### Para Usuarios
1. **Configurar Notificación Individual:**
   - Ir a detalles de una tarea
   - Abrir modal de notificaciones
   - Seleccionar días de anticipación (0-30)
   - Activar notificación

2. **Gestión Global:**
   - Ir al perfil → Configuración de Notificaciones
   - Ver todas las notificaciones configuradas
   - Habilitar/deshabilitar en masa
   - Enviar emails de prueba

### Para Desarrolladores
1. **Extensión del Sistema:**
   - Agregar nuevos tipos de notificación en el modelo
   - Extender templates de email en el servicio
   - Añadir endpoints específicos en el controlador

2. **Monitoreo:**
   - Logs del servicio en consola del servidor
   - Timestamps de último envío en base de datos
   - Estadísticas de uso via endpoint `/stats`

## Archivos Creados/Modificados

### Nuevos Archivos
- `src/models/NotificationPreference.ts`
- `src/services/NotificationService.ts`
- `src/controllers/NotificationController.ts`
- `src/routes/notificationRoutes.ts`
- `src/components/tasks/TaskNotificationModal.tsx`
- `src/components/profile/NotificationSettings.tsx`
- `src/api/NotificationAPI.ts`

### Archivos Modificados
- `src/server.ts` - Integración del servicio de notificaciones
- `src/routes/authRoutes.ts` - Importación de rutas de notificaciones
- `src/components/tasks/TaskModalDetails.tsx` - Botón de notificaciones
- `src/components/profile/Tabs.tsx` - Nueva pestaña de notificaciones
- `src/router.tsx` - Rutas de configuración de perfil
- `package.json` - Dependencia de node-cron

## Estado del Sistema
- ✅ Backend compilando y ejecutándose correctamente
- ✅ Frontend compilando para producción sin errores
- ✅ Servicio de notificaciones inicializado
- ✅ Todas las rutas y componentes integrados
- ✅ Listo para despliegue en producción

## Próximos Pasos (Opcionales)
1. Agregar más tipos de notificación (inicio de proyecto, asignación de tareas)
2. Implementar plantillas de email más sofisticadas
3. Añadir notificaciones en tiempo real (WebSockets)
4. Configuración de horarios personalizados para envío
5. Métricas avanzadas de engagement de emails

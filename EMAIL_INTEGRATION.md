# Integración de Brevo para Envío de Correos

## 📋 Resumen de Cambios

Se ha integrado **Brevo (Sendinblue)** como proveedor de correo para el entorno de producción, manteniendo **Mailtrap** para desarrollo. La implementación utiliza un servicio modular que cambia automáticamente entre proveedores según el entorno.

## 🏗️ Arquitectura Implementada

### 1. EmailService.ts (Nuevo)
**Ubicación:** `src/services/EmailService.ts`

**Características:**
- ✅ Detección automática de entorno (desarrollo vs producción)
- ✅ Brevo para producción (`NODE_ENV=production`)
- ✅ Mailtrap/Nodemailer para desarrollo
- ✅ Métodos específicos para diferentes tipos de correo
- ✅ Manejo de errores robusto
- ✅ TypeScript completamente tipado

**Métodos principales:**
```typescript
// Método genérico
EmailService.sendEmail(emailData: IEmailData)

// Métodos específicos
EmailService.sendConfirmationEmail(user)
EmailService.sendPasswordResetToken(user)
EmailService.sendTaskNotification(data)
```

### 2. AuthEmail.ts (Actualizado)
**Cambios realizados:**
- ❌ Eliminada dependencia directa de `nodemailer`
- ✅ Migrado a usar `EmailService`
- ✅ Mantiene la misma interfaz pública
- ✅ Código más limpio y mantenible

### 3. NotificationService.ts (Actualizado)
**Cambios realizados:**
- ❌ Eliminada dependencia directa de `transporter`
- ✅ Migrado a usar `EmailService`
- ✅ Mantiene toda la funcionalidad de recordatorios
- ✅ Compatibilidad con ambos entornos

## 🔧 Variables de Entorno

### Desarrollo (Mailtrap)
```bash
NODE_ENV=development
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu_mailtrap_user
SMTP_PASS=tu_mailtrap_pass
FROM_EMAIL=admin@loyestask.com
```

### Producción (Brevo)
```bash
NODE_ENV=production
BREVO_API_KEY=tu_clave_api_de_brevo_aqui
FROM_EMAIL=admin@loyestask.com
FRONTEND_URL=https://tu-dominio.com
```

## 📦 Dependencias Añadidas

```json
{
  "dependencies": {
    "@getbrevo/brevo": "^latest"
  }
}
```

## 🚀 Uso del Servicio

### Ejemplo básico:
```typescript
import { EmailService } from '../services/EmailService';

// Correo personalizado
await EmailService.sendEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Asunto del correo',
  html: '<p>Contenido HTML</p>'
});

// Correos predefinidos
await EmailService.sendConfirmationEmail({
  email: 'usuario@ejemplo.com',
  name: 'Juan Pérez',
  token: 'ABC123'
});
```

### Notificaciones de tareas:
```typescript
await EmailService.sendTaskNotification({
  to: 'colaborador@ejemplo.com',
  userName: 'Juan Pérez',
  taskName: 'Revisar documentos',
  projectName: 'Proyecto Alpha',
  type: 'assignment' // 'reminder' | 'overdue'
});
```

## 🔄 Flujo de Decisión

```
¿NODE_ENV === 'production'?
├── Sí → Usar Brevo (API)
└── No → Usar Mailtrap (SMTP)
```

## ✅ Funcionalidades Verificadas

- [x] **Envío de correos de registro** (confirmación de cuenta)
- [x] **Envío de correos de recuperación** (reset de contraseña)  
- [x] **Recordatorios de tareas** (notificaciones automáticas)
- [x] **Separación de entornos** (desarrollo/producción)
- [x] **Manejo de errores** (logging y excepciones)
- [x] **TypeScript** (tipado completo)

## 🔧 Configuración en Producción

1. **Obtener API Key de Brevo:**
   - Registrarse en [Brevo](https://www.brevo.com/)
   - Ir a "Account Settings" → "API Keys"
   - Crear nueva API key
   - Copiar la clave generada

2. **Configurar variables de entorno:**
   ```bash
   BREVO_API_KEY=xkeysib-abc123def456...
   NODE_ENV=production
   FROM_EMAIL=noreply@tudominio.com
   ```

3. **Verificar funcionamiento:**
   - Los logs mostrarán "Correo enviado con Brevo"
   - En desarrollo: "Correo enviado con Nodemailer"

## 🛠️ Mantenimiento

### Agregar nuevos tipos de correo:
1. Añadir método en `EmailService.ts`
2. Definir el template HTML
3. Configurar parámetros específicos
4. Documentar uso

### Debugging:
- Los logs incluyen información del proveedor usado
- Errores se capturan y logean automáticamente
- Verificar variables de entorno si hay fallos

## 📚 Referencias

- [Documentación de Brevo API](https://developers.brevo.com/)
- [SDK oficial @getbrevo/brevo](https://www.npmjs.com/package/@getbrevo/brevo)
- [Configuración de Mailtrap](https://help.mailtrap.io/category/mailtrap-testing/)

---

## 🎯 Resultado Final

La integración permite:
- **Desarrollo local** con Mailtrap (testing seguro)
- **Producción** con Brevo (entrega real)
- **Transición transparente** entre entornos
- **Código mantenible** y escalable
- **Funcionalidad completa** de correos del sistema

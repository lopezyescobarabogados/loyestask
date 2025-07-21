# Configuración Automática de Administrador

## Variables de Entorno para Railway

Para personalizar las credenciales del administrador que se crea automáticamente, configura estas variables de entorno en Railway:

### Variables Opcionales

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `ADMIN_EMAIL` | Email del usuario administrador | `admin@loyestask.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador | `admin123` |
| `ADMIN_NAME` | Nombre del administrador | `Administrador` |

### Configuración en Railway

1. Ve a tu proyecto en Railway
2. Haz clic en la pestaña "Variables"
3. Agrega las variables que desees personalizar:

```
ADMIN_EMAIL=tu-admin@empresa.com
ADMIN_PASSWORD=TuContraseñaSegura123!
ADMIN_NAME=Juan Pérez
```

### Comportamiento del Sistema

- **Primera vez**: Si no existe ningún usuario con rol 'admin', se crea automáticamente
- **Ejecuciones posteriores**: Si ya existe un admin, se omite la creación
- **Producción**: Si hay errores en la creación, la aplicación continúa funcionando
- **Desarrollo**: Los errores detienen la aplicación para facilitar la depuración

### Seguridad

⚠️ **IMPORTANTE**: 
- Cambia la contraseña por defecto inmediatamente después del primer login
- Usa contraseñas seguras en producción
- No compartas las credenciales por defecto

### Logs

Al iniciar la aplicación verás mensajes como:

```
🔧 Verificando usuario administrador...
👤 Creando usuario administrador...
✅ Usuario administrador creado exitosamente
📋 Credenciales del administrador:
📧 Email: admin@loyestask.com
🔑 Password: admin123
👑 Rol: admin
⚠️  IMPORTANTE: Cambia la contraseña después del primer login
```

### Verificación

Para verificar que el admin fue creado correctamente:

1. Inicia sesión en la aplicación
2. Usa las credenciales mostradas en los logs
3. Ve a la sección de administración
4. Cambia la contraseña inmediatamente

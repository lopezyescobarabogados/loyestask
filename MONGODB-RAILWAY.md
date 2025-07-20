# 🗄️ Configuración MongoDB en Railway - LoyesTask

## ¿Por qué usar MongoDB de Railway?

### ✅ Ventajas:
- **Configuración automática**: Railway gestiona la conexión automáticamente
- **Escalado sin configuración**: Se escala según la demanda
- **Red privada**: Conexión segura entre servicios del mismo proyecto
- **Backups automáticos**: Railway maneja los respaldos
- **Sin configuración de strings**: No necesitas gestionar credenciales
- **Facturación unificada**: Todo en una sola cuenta de Railway

### ❌ Por qué NO usar MongoDB Atlas:
- Configuración manual compleja
- Gestión separada de credenciales
- Posibles problemas de conectividad entre Railway y Atlas
- Facturación separada
- Mayor complejidad en troubleshooting

## Configuración Paso a Paso

### 1. Crear Proyecto Railway
```bash
# Ve a railway.app
# Crea nuevo proyecto
# Conecta tu repositorio GitHub
```

### 2. Agregar Plugin MongoDB
```bash
# En tu proyecto Railway:
# 1. Click "Add Service"
# 2. Selecciona "Database"
# 3. Selecciona "MongoDB"
# 4. Railway creará la instancia automáticamente
```

### 3. Variables Automáticas Generadas
Railway genera automáticamente:
```env
DATABASE_URL=mongodb://mongo:password@railway.mongodb.host:port/database
MONGO_URL=mongodb://mongo:password@railway.mongodb.host:port/database
```

### 4. Configuración en el Backend
El código ya está optimizado para Railway:

```typescript
// src/config/db.ts - Ya configurado ✅
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  retryWrites: true,
  writeConcern: {
    w: 'majority' as const
  }
};
```

## Variables de Entorno por Servicio

### Backend Service
```env
# Automáticas (Railway las genera)
DATABASE_URL=mongodb://... # ← Plugin MongoDB
PORT=4000                  # ← Railway
RAILWAY_ENVIRONMENT=production

# Manuales (tienes que configurar)
JWT_SECRET=un_secret_muy_seguro_de_32_caracteres_minimo
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.railway.app

# Opcionales
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Frontend Service
```env
# Manual
VITE_API_URL=https://tu-backend.railway.app/api
```

## Troubleshooting

### Error: "DATABASE_URL no está definida"
**Solución:**
1. Verifica que el plugin MongoDB esté agregado
2. Ve a Variables del backend y confirma que `DATABASE_URL` existe
3. Reinicia el servicio backend

### Error: "Connection timeout"
**Solución:**
1. Verifica que ambos servicios estén en el mismo proyecto Railway
2. Checa los logs del plugin MongoDB
3. Asegúrate que no hay firewall blocking

### Error: "Authentication failed"
**Solución:**
1. Borra y vuelve a crear el plugin MongoDB
2. Verifica que la `DATABASE_URL` sea la correcta
3. No modifiques manualmente la `DATABASE_URL`

## Comandos Útiles

### Verificar Conexión
```bash
# En Railway Terminal del backend:
node -e "console.log(process.env.DATABASE_URL)"
```

### Crear Admin (Post-Deploy)
```bash
# En Railway Terminal del backend:
npm run create-admin:prod
```

### Ver Logs MongoDB
```bash
# En Railway:
# 1. Ve al plugin MongoDB
# 2. Revisa la pestaña "Logs"
```

## Monitoring

### Métricas a Monitorear:
- **Conexiones activas**: Max 10 (pool size)
- **Tiempo de respuesta**: < 500ms promedio
- **Memoria de MongoDB**: Uso del plugin
- **Errores de conexión**: En logs del backend

### Health Check Personalizado:
```bash
curl https://tu-backend.railway.app/health
# Debe retornar:
{
  "status": "OK",
  "timestamp": "2025-07-20T...",
  "environment": "production",
  "database": "connected"
}
```

## Mejores Prácticas

### ✅ Hacer:
1. Usar el plugin de MongoDB de Railway
2. Mantener las variables automáticas sin modificar
3. Usar el pool de conexiones configurado
4. Monitorear logs regularmente
5. Hacer backups manuales antes de cambios importantes

### ❌ No hacer:
1. Modificar `DATABASE_URL` manualmente
2. Usar conexiones directas a MongoDB sin mongoose
3. Crear múltiples conexiones
4. Ignorar los timeouts configurados
5. Usar MongoDB Atlas junto con Railway

## Migración desde MongoDB Atlas

Si ya tienes datos en Atlas y quieres migrar:

### 1. Exportar datos de Atlas:
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/database"
```

### 2. Importar a Railway MongoDB:
```bash
# Obtener URL de Railway MongoDB
mongorestore --uri="$DATABASE_URL" dump/
```

### 3. Verificar migración:
```bash
# Contar documentos en ambas bases
mongo $ATLAS_URL --eval "db.stats()"
mongo $DATABASE_URL --eval "db.stats()"
```

## Scripts Automatizados

### Setup Completo:
```bash
# Ya incluido en el proyecto:
./loyestaskBackend/railway-setup.sh
```

### Verificación Pre-Deploy:
```bash
# Ya incluido en el proyecto:
./verify-railway-ready.sh
```

## Soporte

Si tienes problemas:

1. **Revisa logs**: Railway Dashboard > Service > Logs
2. **Verifica variables**: Railway Dashboard > Service > Variables  
3. **Checa plugin**: Railway Dashboard > MongoDB Plugin > Status
4. **Consulta docs**: [railway.app/docs](https://docs.railway.app)
5. **Community**: [Railway Discord](https://discord.gg/railway)

## 🎉 Resumen

Con esta configuración tienes:
- ✅ MongoDB totalmente gestionado por Railway
- ✅ Configuración automática de conexión
- ✅ Backups automáticos
- ✅ Escalado automático
- ✅ Red privada segura
- ✅ Monitoreo integrado

¡Tu aplicación está lista para producción en Railway! 🚀

#!/bin/bash

# Script para Railway - Setup inicial con MongoDB de Railway
echo "🚀 Configurando LoyesTask en Railway con MongoDB..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo "🔧 Asegúrate de haber agregado el plugin de MongoDB en Railway"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET no está configurada"
    echo "🔧 Configura JWT_SECRET con al menos 32 caracteres"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  WARNING: FRONTEND_URL no está configurada"
    echo "🔧 Configúrala después de desplegar el frontend"
fi

echo "✅ Variables de entorno configuradas correctamente"
echo "🗄️  MongoDB URL: ${DATABASE_URL}"
echo "🌐 Frontend URL: ${FRONTEND_URL:-'No configurada aún'}"

# Esperar a que MongoDB esté disponible
echo "⏳ Esperando a que MongoDB esté disponible..."
sleep 10

# Crear usuario admin
echo "👤 Creando usuario administrador..."
if npm run create-admin:prod; then
    echo "✅ Usuario administrador creado exitosamente"
else
    echo "⚠️  Error al crear usuario admin - puedes intentarlo manualmente después"
fi

echo "🎉 Setup completado exitosamente!"
echo "📝 Próximos pasos:"
echo "   1. Despliega el frontend"
echo "   2. Actualiza FRONTEND_URL con la URL del frontend desplegado"
echo "   3. Verifica que la aplicación funcione correctamente"

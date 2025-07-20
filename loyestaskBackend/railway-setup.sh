#!/bin/bash

# Script para Railway - Setup inicial
echo "🚀 Configurando LoyesTask en Railway..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET no está configurada"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ ERROR: FRONTEND_URL no está configurada"
    exit 1
fi

echo "✅ Variables de entorno configuradas correctamente"

# Crear usuario admin
echo "👤 Creando usuario administrador..."
npm run create-admin:prod

echo "🎉 Setup completado exitosamente!"
echo "📝 Recuerda configurar las variables de entorno del frontend con la URL de este backend"

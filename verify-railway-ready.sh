#!/bin/bash

# Script de verificación pre-despliegue para Railway
echo "🔍 Verificando que la aplicación esté lista para Railway..."

echo "📂 Verificando estructura de archivos..."

# Backend
if [ -f "loyestask_Backend/package.json" ]; then
    echo "✅ package.json del backend encontrado"
else
    echo "❌ package.json del backend no encontrado"
    exit 1
fi

if [ -f "loyestask_Backend/.env.example" ]; then
    echo "✅ .env.example del backend encontrado"
else
    echo "❌ .env.example del backend no encontrado"
fi

# Frontend
if [ -f "loyestask_Frontend/package.json" ]; then
    echo "✅ package.json del frontend encontrado"
else
    echo "❌ package.json del frontend no encontrado"
    exit 1
fi

if [ -f "loyestask_Frontend/.env.example" ]; then
    echo "✅ .env.example del frontend encontrado"
else
    echo "❌ .env.example del frontend no encontrado"
fi

echo "🏗️ Verificando scripts de build..."

# Verificar scripts del backend
cd loyestask_Backend
if npm run build >/dev/null 2>&1; then
    echo "✅ Build del backend exitoso"
else
    echo "❌ Error en build del backend"
    exit 1
fi

# Verificar scripts del frontend
cd ../loyestask_Frontend
if npm run build >/dev/null 2>&1; then
    echo "✅ Build del frontend exitoso"
else
    echo "❌ Error en build del frontend"
    exit 1
fi

cd ..

echo "📋 Verificando archivos de documentación..."
if [ -f "RAILWAY-DEPLOY.md" ]; then
    echo "✅ Guía de despliegue encontrada"
else
    echo "❌ Guía de despliegue no encontrada"
fi

if [ -f "README.md" ]; then
    echo "✅ README encontrado"
else
    echo "❌ README no encontrado"
fi

echo ""
echo "🎉 ¡Verificación completada!"
echo ""
echo "📝 Variables de entorno necesarias para Railway:"
echo "   Backend:"
echo "   - DATABASE_URL (MongoDB)"
echo "   - JWT_SECRET (32+ caracteres)"
echo "   - FRONTEND_URL (URL del frontend en Railway)"
echo "   - NODE_ENV=production"
echo ""
echo "   Frontend:"
echo "   - VITE_API_URL (URL del backend en Railway + /api)"
echo ""
echo "🚀 La aplicación está lista para desplegar en Railway!"
echo "📖 Lee RAILWAY-DEPLOY.md para las instrucciones completas"

#!/bin/bash

# Script de verificación pre-despliegue para Railway con MongoDB
echo "🔍 Verificando que la aplicación esté lista para Railway con MongoDB..."

echo "📂 Verificando estructura de archivos..."

# Backend
if [ -f "loyestaskBackend/package.json" ]; then
    echo "✅ package.json del backend encontrado"
else
    echo "❌ package.json del backend no encontrado"
    exit 1
fi

if [ -f "loyestaskBackend/.env.example" ]; then
    echo "✅ .env.example del backend encontrado"
else
    echo "❌ .env.example del backend no encontrado"
fi

if [ -f "loyestaskBackend/railway.json" ]; then
    echo "✅ railway.json del backend encontrado"
else
    echo "❌ railway.json del backend no encontrado"
fi

if [ -f "loyestaskBackend/Procfile" ]; then
    echo "✅ Procfile del backend encontrado"
else
    echo "❌ Procfile del backend no encontrado"
fi

# Frontend
if [ -f "loyestaskFrontend/package.json" ]; then
    echo "✅ package.json del frontend encontrado"
else
    echo "❌ package.json del frontend no encontrado"
    exit 1
fi

if [ -f "loyestaskFrontend/.env.example" ]; then
    echo "✅ .env.example del frontend encontrado"
else
    echo "❌ .env.example del frontend no encontrado"
fi

if [ -f "loyestaskFrontend/railway.json" ]; then
    echo "✅ railway.json del frontend encontrado"
else
    echo "❌ railway.json del frontend no encontrado"
fi

echo "🏗️ Verificando scripts de build..."

# Verificar scripts del backend
cd loyestaskBackend
if npm run build >/dev/null 2>&1; then
    echo "✅ Build del backend exitoso"
else
    echo "❌ Error en build del backend"
    exit 1
fi

# Verificar scripts del frontend
cd ../loyestaskFrontend
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

if [ -f "RAILWAY-CONFIG.md" ]; then
    echo "✅ Configuración específica de Railway encontrada"
else
    echo "❌ Configuración de Railway no encontrada"
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
echo ""
echo "   📦 Backend:"
echo "   - DATABASE_URL (automática - plugin MongoDB)"
echo "   - JWT_SECRET (manual - 32+ caracteres)"
echo "   - NODE_ENV=production (manual)"
echo "   - FRONTEND_URL (manual - después de desplegar frontend)"
echo "   - PORT (automática - Railway)"
echo ""
echo "   🌐 Frontend:"
echo "   - VITE_API_URL (manual - URL del backend + /api)"
echo ""
echo "🗄️ MongoDB:"
echo "   - Usar plugin de MongoDB de Railway"
echo "   - NO usar MongoDB Atlas"
echo "   - DATABASE_URL se configura automáticamente"
echo ""
echo "🚀 Orden de despliegue:"
echo "   1. Crear proyecto en Railway"
echo "   2. Agregar plugin de MongoDB"
echo "   3. Desplegar backend"
echo "   4. Desplegar frontend"
echo "   5. Configurar referencias cruzadas"
echo "   6. Crear usuario admin"
echo ""
echo "📖 Lee RAILWAY-DEPLOY.md y RAILWAY-CONFIG.md para instrucciones detalladas"

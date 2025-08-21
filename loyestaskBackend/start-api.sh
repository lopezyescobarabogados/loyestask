#!/bin/bash

# Script para iniciar el backend en modo API de manera estable
# Limpia todos los procesos relacionados antes de iniciar

echo "🔧 Iniciando LoyesTask Backend API..."

# Ejecutar script de limpieza
echo "🧹 Ejecutando limpieza de procesos..."
./kill-processes.sh

# Verificar variables de entorno críticas
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Cargando variables de entorno desde .env..."
    if [ -f .env ]; then
        source .env
    else
        echo "❌ Error: Archivo .env no encontrado"
        exit 1
    fi
fi

# Verificar que Node.js y npm estén disponibles
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está disponible"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo "✅ Puerto 4000 libre. Iniciando backend..."

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Crear archivo de log si no existe
mkdir -p logs
LOG_FILE="logs/backend-$(date +%Y%m%d).log"

# Iniciar el backend con manejo de errores
echo "🚀 Iniciando servidor LoyesTask..."
echo "📋 Log: $LOG_FILE"

# Función para limpiar al salir
cleanup() {
    echo "🔄 Deteniendo servidor..."
    ./kill-processes.sh
    exit 0
}

# Configurar trap para limpieza al salir
trap cleanup SIGINT SIGTERM

# Iniciar con reinicio automático en caso de error
npm run dev:api 2>&1 | tee "$LOG_FILE"

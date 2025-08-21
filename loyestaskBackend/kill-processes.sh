#!/bin/bash

# Script para terminar todos los procesos relacionados con LoyesTask Backend
echo "🔪 Terminando todos los procesos del backend..."

# Terminar procesos por puerto
if command -v lsof &> /dev/null; then
    if lsof -i :4000 > /dev/null 2>&1; then
        echo "🔍 Terminando procesos en puerto 4000..."
        lsof -ti :4000 | xargs -r kill -9
    fi
else
    # Alternativa con ss y netstat
    PIDS=$(ss -tlnp | grep :4000 | grep -oP 'pid=\K[^,]+' | sort -u)
    if [ ! -z "$PIDS" ]; then
        echo "🔍 Terminando procesos en puerto 4000: $PIDS"
        echo $PIDS | xargs -r kill -9
    fi
fi

# Terminar procesos por nombre/comando
echo "🔍 Terminando procesos nodemon y ts-node relacionados..."
pkill -f "nodemon.*loyestask" 2>/dev/null || true
pkill -f "ts-node.*index.ts" 2>/dev/null || true
pkill -f "node.*loyestask.*index" 2>/dev/null || true

# Verificar que no queden procesos
sleep 2
REMAINING=$(ps aux | grep -E "(nodemon|ts-node).*loyestask" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo "⚠️  Quedan $REMAINING procesos activos, terminando con SIGKILL..."
    ps aux | grep -E "(nodemon|ts-node).*loyestask" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
fi

echo "✅ Limpieza de procesos completada"

# Verificar puerto libre
if command -v lsof &> /dev/null; then
    if lsof -i :4000 > /dev/null 2>&1; then
        echo "❌ Error: Puerto 4000 aún ocupado"
        lsof -i :4000
        exit 1
    fi
else
    if ss -tlnp | grep :4000 > /dev/null 2>&1; then
        echo "❌ Error: Puerto 4000 aún ocupado"
        ss -tlnp | grep :4000
        exit 1
    fi
fi

echo "✅ Puerto 4000 libre y listo para usar"

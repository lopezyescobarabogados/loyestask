#!/bin/bash

# Script para probar la API de tareas y verificar que incluya archivos
echo "🔍 Verificando respuesta de API para tarea con archivos..."

# Variables (ajustar según necesidad)
PROJECT_ID="<project-id-aquí>"
TASK_ID="<task-id-aquí>"
API_BASE="http://localhost:4000/api"

# Test 1: Obtener tarea específica
echo "📋 1. Obteniendo datos de tarea..."
curl -s -X GET "${API_BASE}/projects/${PROJECT_ID}/tasks/${TASK_ID}" \
  -H "Content-Type: application/json" \
  | python3 -m json.tool

echo -e "\n📁 2. Obteniendo archivos por endpoint separado..."
curl -s -X GET "${API_BASE}/projects/${PROJECT_ID}/tasks/${TASK_ID}/files" \
  -H "Content-Type: application/json" \
  | python3 -m json.tool

echo -e "\n✅ Verificación completada"

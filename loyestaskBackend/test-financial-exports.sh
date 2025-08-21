#!/bin/bash

# Script de prueba para los nuevos endpoints de exportación financiera
# Solo para administradores

echo "🧪 PRUEBAS DE EXPORTACIÓN FINANCIERA"
echo "======================================"

# Configuración
BASE_URL="http://localhost:4000"
ADMIN_EMAIL="admin@loyestask.com"
ADMIN_PASSWORD="admin123"

echo "📡 1. Obteniendo token de administrador..."

# Obtener token de admin
TOKEN_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error obteniendo token de administrador"
  echo "Respuesta: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido exitosamente"

echo ""
echo "📋 2. Probando endpoint: Lista de reportes disponibles"
echo "GET /api/financial-exports/available"

curl -s -X GET \
  "${BASE_URL}/api/financial-exports/available" \
  -H "Authorization: Bearer ${TOKEN}" | jq . || echo "Respuesta no es JSON válido"

echo ""
echo "📊 3. Probando endpoint: Datos del reporte mensual"
echo "GET /api/financial-exports/monthly/2025/8/data"

curl -s -X GET \
  "${BASE_URL}/api/financial-exports/monthly/2025/8/data" \
  -H "Authorization: Bearer ${TOKEN}" | jq . || echo "Respuesta no es JSON válido"

echo ""
echo "📄 4. Probando endpoint: Exportación PDF"
echo "GET /api/financial-exports/monthly/2025/8/pdf"

PDF_RESPONSE=$(curl -s -w "%{http_code}" -o "/tmp/reporte_test.pdf" \
  "${BASE_URL}/api/financial-exports/monthly/2025/8/pdf" \
  -H "Authorization: Bearer ${TOKEN}")

if [ "$PDF_RESPONSE" = "200" ]; then
  echo "✅ PDF generado exitosamente"
  echo "📁 Archivo guardado en: /tmp/reporte_test.pdf"
  ls -lh /tmp/reporte_test.pdf
else
  echo "❌ Error generando PDF. Código HTTP: $PDF_RESPONSE"
fi

echo ""
echo "📊 5. Probando endpoint: Exportación Excel"
echo "GET /api/financial-exports/monthly/2025/8/excel"

EXCEL_RESPONSE=$(curl -s -w "%{http_code}" -o "/tmp/reporte_test.xlsx" \
  "${BASE_URL}/api/financial-exports/monthly/2025/8/excel" \
  -H "Authorization: Bearer ${TOKEN}")

if [ "$EXCEL_RESPONSE" = "200" ]; then
  echo "✅ Excel generado exitosamente"
  echo "📁 Archivo guardado en: /tmp/reporte_test.xlsx"
  ls -lh /tmp/reporte_test.xlsx
else
  echo "❌ Error generando Excel. Código HTTP: $EXCEL_RESPONSE"
fi

echo ""
echo "🔒 6. Probando seguridad: Acceso sin token"
echo "GET /api/financial-exports/available (sin auth)"

UNAUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  "${BASE_URL}/api/financial-exports/available")

if [ "$UNAUTH_RESPONSE" = "401" ]; then
  echo "✅ Seguridad correcta: Acceso denegado sin token"
else
  echo "❌ Error de seguridad: Código HTTP: $UNAUTH_RESPONSE"
fi

echo ""
echo "📋 7. Probando validación: Mes inválido"
echo "GET /api/financial-exports/monthly/2025/13/data"

INVALID_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/financial-exports/monthly/2025/13/data" \
  -H "Authorization: Bearer ${TOKEN}" | jq . || echo "Respuesta no es JSON válido")

echo ""
echo "🎉 PRUEBAS COMPLETADAS"
echo "======================"
echo "Los archivos de prueba están en:"
echo "📄 PDF: /tmp/reporte_test.pdf"
echo "📊 Excel: /tmp/reporte_test.xlsx"

#!/bin/bash

echo "🔧 DIAGNÓSTICO DE API DE PAGOS - LoyesTask"
echo "=============================================="

# Verificar backend
echo "1️⃣ Verificando backend..."
BACKEND_STATUS=$(curl -s -w "%{http_code}" http://localhost:4000/health -o /dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend funcionando (puerto 4000)"
else
    echo "❌ Backend no responde en puerto 4000"
    exit 1
fi

# Verificar frontend
echo "2️⃣ Verificando frontend..."
FRONTEND_STATUS=$(curl -s -w "%{http_code}" http://localhost:5173 -o /dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend funcionando (puerto 5173)"
else
    echo "❌ Frontend no responde en puerto 5173"
fi

echo ""
echo "3️⃣ Probando endpoints de pagos..."

# Test crear cuenta primero (necesaria para pagos)
echo "📦 Creando cuenta de prueba..."
ACCOUNT_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/accounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{
    "name": "Cuenta Test",
    "type": "checking",
    "accountNumber": "TEST-001",
    "bankName": "Banco Test",
    "balance": 1000,
    "currency": "MXN"
  }')

echo "Respuesta cuenta: $ACCOUNT_RESPONSE"

# Test crear pago
echo "💰 Probando crear pago..."
PAYMENT_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{
    "type": "income",
    "amount": 500,
    "currency": "MXN",
    "description": "Pago de prueba",
    "method": "bank_transfer",
    "paymentDate": "2025-08-21",
    "status": "completed",
    "account": "test-account-id"
  }')

echo "Respuesta pago: $PAYMENT_RESPONSE"

# Test obtener pagos
echo "📋 Probando obtener pagos..."
PAYMENTS_LIST=$(curl -s -X GET "http://localhost:4000/api/payments" \
  -H "Authorization: Bearer fake-token")

echo "Lista pagos: $PAYMENTS_LIST"

echo ""
echo "🔍 ANÁLISIS COMPLETADO"

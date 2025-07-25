#!/bin/bash

# ============================================================================
# LOYESTASK - SCRIPT DE VERIFICACIÓN PARA RAILWAY
# ============================================================================

echo "🔍 Verificando configuración del sistema LoyesTask..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para verificar variable
check_var() {
    local var_name=$1
    local var_value=$(printenv $var_name)
    local required=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name${NC}"
            echo -e "   ${description}"
            echo -e "   ${RED}REQUERIDA pero no configurada${NC}"
            echo ""
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name${NC}"
            echo -e "   ${description}"
            echo -e "   ${YELLOW}Opcional - no configurada${NC}"
            echo ""
            return 0
        fi
    else
        # Enmascarar valores sensibles
        if [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"PASSWORD"* ]] || [[ $var_name == *"KEY"* ]]; then
            masked_value="${var_value:0:4}****${var_value: -4}"
        else
            masked_value="$var_value"
        fi
        
        echo -e "${GREEN}✅ $var_name${NC}"
        echo -e "   ${description}"
        echo -e "   ${BLUE}$masked_value${NC}"
        echo ""
        return 0
    fi
}

echo -e "${CYAN}📋 VARIABLES OBLIGATORIAS:${NC}"
echo ""

# Variables obligatorias
errors=0

check_var "DATABASE_URL" "true" "URL de conexión a MongoDB"
if [ $? -ne 0 ]; then ((errors++)); fi

check_var "JWT_SECRET" "true" "Clave secreta para JWT (mínimo 32 caracteres)"
if [ $? -ne 0 ]; then ((errors++)); fi

check_var "BREVO_API_KEY" "true" "API Key de Brevo para envío de emails"
if [ $? -ne 0 ]; then ((errors++)); fi

check_var "FROM_EMAIL" "true" "Email remitente principal"
if [ $? -ne 0 ]; then ((errors++)); fi

check_var "FRONTEND_URL" "true" "URL del frontend desplegado"
if [ $? -ne 0 ]; then ((errors++)); fi

check_var "NODE_ENV" "true" "Entorno de ejecución (production)"
if [ $? -ne 0 ]; then ((errors++)); fi

echo -e "${CYAN}📋 VARIABLES OPCIONALES RECOMENDADAS:${NC}"
echo ""

# Variables opcionales
check_var "EMAIL_FROM_NAME" "false" "Nombre del remitente de emails"
check_var "DAILY_REMINDER_HOUR" "false" "Hora para recordatorios diarios (0-23)"
check_var "SPECIFIC_REMINDER_HOUR" "false" "Hora para recordatorios específicos (0-23)"
check_var "ADMIN_EMAIL" "false" "Email del usuario administrador inicial"
check_var "ADMIN_PASSWORD" "false" "Contraseña del usuario administrador inicial"
check_var "MAX_DAILY_EMAILS" "false" "Límite máximo de emails por día"

echo -e "${CYAN}� VERIFICACIONES ESPECÍFICAS:${NC}"
echo ""

# Verificar formato de JWT_SECRET
if [ ! -z "$JWT_SECRET" ]; then
    if [ ${#JWT_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✅ JWT_SECRET tiene longitud adecuada (${#JWT_SECRET} caracteres)${NC}"
    else
        echo -e "${RED}❌ JWT_SECRET debe tener al menos 32 caracteres (actual: ${#JWT_SECRET})${NC}"
        ((errors++))
    fi
else
    echo -e "${RED}❌ JWT_SECRET no está configurado${NC}"
    ((errors++))
fi

# Verificar formato de BREVO_API_KEY
if [ ! -z "$BREVO_API_KEY" ]; then
    if [[ $BREVO_API_KEY == xkeysib-* ]]; then
        echo -e "${GREEN}✅ BREVO_API_KEY tiene formato correcto${NC}"
    else
        echo -e "${RED}❌ BREVO_API_KEY debe comenzar con 'xkeysib-'${NC}"
        ((errors++))
    fi
fi

# Verificar formato de FROM_EMAIL
if [ ! -z "$FROM_EMAIL" ]; then
    if [[ $FROM_EMAIL =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        echo -e "${GREEN}✅ FROM_EMAIL tiene formato válido${NC}"
    else
        echo -e "${RED}❌ FROM_EMAIL no tiene formato de email válido${NC}"
        ((errors++))
    fi
fi

# Verificar NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✅ NODE_ENV configurado para producción${NC}"
else
    echo -e "${YELLOW}⚠️  NODE_ENV no está en 'production' (actual: ${NODE_ENV})${NC}"
fi

# Verificar que no se usen variables SMTP en producción
if [ "$NODE_ENV" = "production" ]; then
    smtp_vars=("SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS")
    for var in "${smtp_vars[@]}"; do
        if [ ! -z "$(printenv $var)" ]; then
            echo -e "${YELLOW}⚠️  $var configurada en producción - debería usar Brevo API${NC}"
        fi
    done
fi

echo ""
echo -e "${CYAN}📊 RESUMEN:${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 CONFIGURACIÓN VÁLIDA - LISTO PARA DESPLEGAR${NC}"
    echo ""
    echo -e "${BLUE}📝 Próximos pasos:${NC}"
    echo "   1. Verificar que MongoDB esté accesible"
    echo "   2. Probar conexión a Brevo API"
    echo "   3. Configurar el frontend con la URL del backend"
    echo "   4. Verificar que los cron jobs funcionen"
    echo ""
    exit 0
else
    echo -e "${RED}💥 HAY $errors ERRORES EN LA CONFIGURACIÓN${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Comandos para configurar variables faltantes:${NC}"
    echo ""
    echo "railway variables set DATABASE_URL=\"mongodb+srv://user:pass@cluster.mongodb.net/loyestask\""
    echo "railway variables set JWT_SECRET=\"$(openssl rand -base64 48 | tr -d '\n')\""
    echo "railway variables set BREVO_API_KEY=\"xkeysib-tu-api-key-aqui\""
    echo "railway variables set FROM_EMAIL=\"notifications@tudominio.com\""
    echo "railway variables set FRONTEND_URL=\"https://tu-frontend.up.railway.app\""
    echo "railway variables set NODE_ENV=\"production\""
    echo ""
    exit 1
fi
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

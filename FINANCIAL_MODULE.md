# 💰 **Módulo de Gestión Financiera - LoyesTask**

## 📊 **Descripción General**

El módulo de gestión financiera es un sistema completo integrado en LoyesTask que permite:

- ✅ **Gestión de Facturas** (enviadas/recibidas)
- ✅ **Seguimiento de Pagos** (ingresos/gastos)
- ✅ **Detección Automática de Vencimientos**
- ✅ **Gestión de Cuentas con balances en tiempo real**
- ✅ **Reportes Financieros Completos**
- ✅ **Cierre de Períodos Contables** (solo admin)

---

## 🏗️ **Arquitectura del Sistema**

### **1. Modelos de Datos**

#### **Invoice (Facturas)**
```typescript
{
  invoiceNumber: string;     // INV-2025-0001 / REC-2025-0001
  type: "sent" | "received"; // Enviada o recibida
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  client: string;            // Cliente
  provider?: string;         // Proveedor (para facturas recibidas)
  total: number;            // Monto total
  dueDate: Date;            // Fecha de vencimiento
  isLocked: boolean;        // Bloqueada por período cerrado
}
```

#### **Payment (Pagos)**
```typescript
{
  paymentNumber: string;     // PAY-IN-2025-0001 / PAY-OUT-2025-0001
  type: "income" | "expense"; // Ingreso o gasto
  status: "pending" | "completed" | "failed" | "cancelled";
  method: "cash" | "bank_transfer" | "check" | "credit_card" | "debit_card" | "other";
  amount: number;           // Monto
  account: ObjectId;        // Cuenta asociada
  invoice?: ObjectId;       // Factura vinculada (opcional)
  category?: string;        // Categoría del gasto
}
```

#### **Account (Cuentas)**
```typescript
{
  name: string;             // Nombre de la cuenta
  type: "bank" | "cash" | "credit_card" | "savings" | "other";
  status: "active" | "inactive" | "closed";
  balance: number;          // Balance actual
  initialBalance: number;   // Balance inicial
  accountNumber?: string;   // Número de cuenta
  bankName?: string;        // Nombre del banco
}
```

#### **FinancialPeriod (Períodos Contables)**
```typescript
{
  year: number;             // Año
  month: number;            // Mes (1-12)
  status: "open" | "closed"; // Estado del período
  closedBy?: ObjectId;      // Admin que cerró el período
  totalIncome: number;      // Total de ingresos
  totalExpenses: number;    // Total de gastos
  netIncome: number;        // Ingreso neto
}
```

---

## 🛣️ **Endpoints de API**

### **📄 Facturas (`/api/invoices`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Crear factura | ✅ |
| `GET` | `/` | Listar facturas (con filtros) | ✅ |
| `GET` | `/:id` | Obtener factura por ID | ✅ |
| `PUT` | `/:id` | Actualizar factura | ✅ |
| `PATCH` | `/:id/status` | Cambiar estado | ✅ |
| `DELETE` | `/:id` | Eliminar factura | ✅ |
| `GET` | `/overdue` | Facturas vencidas | ✅ |
| `GET` | `/summary` | Resumen de facturas | ✅ |

**Filtros disponibles:**
- `page`, `limit` - Paginación
- `status` - Estado de factura
- `type` - Tipo (sent/received)
- `client`, `provider` - Búsqueda por texto

### **💰 Pagos (`/api/payments`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Registrar pago | ✅ |
| `GET` | `/` | Listar pagos (con filtros) | ✅ |
| `GET` | `/:id` | Obtener pago por ID | ✅ |
| `PUT` | `/:id` | Actualizar pago | ✅ |
| `PATCH` | `/:id/status` | Cambiar estado | ✅ |
| `DELETE` | `/:id` | Eliminar pago | ✅ |
| `GET` | `/type/:type` | Pagos por tipo | ✅ |
| `GET` | `/summary` | Resumen de pagos | ✅ |

### **🏦 Cuentas (`/api/accounts`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Crear cuenta | ✅ |
| `GET` | `/` | Listar cuentas | ✅ |
| `GET` | `/:id` | Obtener cuenta por ID | ✅ |
| `PUT` | `/:id` | Actualizar cuenta | ✅ |
| `PATCH` | `/:id/status` | Cambiar estado | ✅ |
| `DELETE` | `/:id` | Eliminar cuenta | ✅ |
| `GET` | `/:id/movements` | Movimientos de cuenta | ✅ |
| `GET` | `/balance` | Balance total | ✅ |
| `POST` | `/transfer` | Transferir entre cuentas | ✅ |

### **📅 Períodos Contables (`/api/financial-periods`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Listar períodos | ✅ |
| `GET` | `/current` | Período actual | ✅ |
| `GET` | `/years` | Años disponibles | ✅ |
| `GET` | `/:id` | Obtener período por ID | ✅ |
| `GET` | `/:year/:month/summary` | Resumen período | ✅ |
| `PATCH` | `/:id/close` | Cerrar período | 🔒 Admin |
| `PATCH` | `/:id/reopen` | Reabrir período | 🔒 Admin |

### **📊 Reportes Financieros (`/api/financial-reports`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard` | Dashboard general | ✅ |
| `GET` | `/cash-flow` | Flujo de caja | ✅ |
| `GET` | `/accounts-receivable` | Cuentas por cobrar | ✅ |
| `GET` | `/client-profitability` | Rentabilidad por cliente | ✅ |
| `GET` | `/income-projection` | Proyección de ingresos | ✅ |
| `GET` | `/expense-analysis` | Análisis de gastos | ✅ |

### **📄 Exportación de Reportes (`/api/financial-exports`)**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/available` | Lista reportes disponibles | 🔒 Admin |
| `GET` | `/monthly/:year/:month/data` | Datos reporte mensual (JSON) | 🔒 Admin |
| `GET` | `/monthly/:year/:month/excel` | Exportar reporte a Excel | 🔒 Admin |
| `GET` | `/monthly/:year/:month/pdf` | Exportar reporte a PDF | 🔒 Admin |

**Parámetros disponibles:**
- `year` - Año del reporte (2020-2030)
- `month` - Mes del reporte (1-12)
- `year` (query) - Filtrar por año en `/available`

---

## 🤖 **Sistema de Notificaciones Automáticas**

### **Tareas Programadas (Cron Jobs)**

1. **📧 Facturas Vencidas** - Diario a las 9:00 AM
   - Detecta facturas vencidas
   - Cambia estado a "overdue"
   - Envía notificaciones por email

2. **⏰ Recordatorios** - Diario a las 10:00 AM
   - Facturas próximas a vencer (3 días antes)
   - Alertas preventivas

3. **📋 Reporte Semanal** - Lunes a las 8:00 AM
   - Resumen financiero para administradores
   - Balance total, ingresos, gastos
   - Facturas pendientes y vencidas

4. **📊 Reporte Mensual** - 1er día del mes a las 9:00 AM
   - Análisis completo del mes anterior
   - Flujo de caja, clientes top, gastos por categoría

### **Variables de Entorno para Notificaciones**

```env
# Activar/desactivar notificaciones por email
SEND_OVERDUE_EMAILS=true
SEND_UPCOMING_EMAILS=true
SEND_WEEKLY_REPORTS=true
SEND_MONTHLY_REPORTS=true
SEND_BALANCE_ALERTS=true
```

---

## 🔒 **Sistema de Seguridad y Permisos**

### **Middleware de Validación**

- ✅ **Autenticación requerida** para todos los endpoints
- ✅ **Validación de propiedad** de recursos
- ✅ **Validación de períodos cerrados**
- ✅ **Permisos de administrador** para cierre de períodos
- ✅ **Validación de datos** con express-validator

### **Protecciones Implementadas**

1. **Períodos Cerrados**: No se pueden modificar facturas/pagos de períodos cerrados
2. **Validación de Balances**: No permite transferencias sin saldo suficiente
3. **Integridad Referencial**: No permite eliminar cuentas con movimientos
4. **Validación de Fechas**: No permite fechas futuras en pagos
5. **Límites de Montos**: Protección contra montos excesivos

---

## 📈 **Características Principales**

### **1. Gestión de Facturas**
- ✅ Numeración automática (INV-2025-0001)
- ✅ Estados completos del ciclo de vida
- ✅ Detección automática de vencimientos
- ✅ Soporte para adjuntos
- ✅ Filtrado y búsqueda avanzada

### **2. Control de Pagos**
- ✅ Numeración automática (PAY-IN/OUT-2025-0001)
- ✅ Actualización automática de balances
- ✅ Vinculación con facturas
- ✅ Categorización de gastos
- ✅ Múltiples métodos de pago

### **3. Gestión de Cuentas**
- ✅ Balance en tiempo real
- ✅ Transferencias entre cuentas
- ✅ Historial completo de movimientos
- ✅ Múltiples tipos de cuenta
- ✅ Validaciones de integridad

### **4. Reportes Financieros**
- ✅ **Dashboard** con métricas clave
- ✅ **Aging Report** (antigüedad de saldos)
- ✅ **Flujo de Caja** mensual
- ✅ **Rentabilidad por Cliente**
- ✅ **Proyecciones de Ingresos**
- ✅ **Análisis de Gastos por Categoría**

### **5. Cierre Contable**
- ✅ Solo administradores pueden cerrar períodos
- ✅ Cálculo automático de totales
- ✅ Bloqueo de modificaciones
- ✅ Inmutabilidad de registros históricos
- ✅ Capacidad de reapertura controlada

### **6. Exportación de Reportes (NUEVO)**
- ✅ **Reportes Mensuales Detallados** - Solo admin
- ✅ **Exportación a Excel** - 5 hojas con datos completos
- ✅ **Exportación a PDF** - Resumen ejecutivo profesional
- ✅ **Validación de Períodos** - No permite reportes futuros
- ✅ **Datos Estructurados** - Facturas, pagos, cuentas, flujo de caja
- ✅ **Formato Profesional** - Colores, formatos de moneda, totales

---

## 🔧 **Configuración y Uso**

### **1. Variables de Entorno**

```env
# Base de datos
DATABASE_URL=mongodb://localhost:27017/loyestask

# Email (Brevo/SendGrid)
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME=LoyesTask
EMAIL_FROM_ADDRESS=noreply@loyestask.com

# Notificaciones financieras
SEND_OVERDUE_EMAILS=true
SEND_WEEKLY_REPORTS=true
SEND_MONTHLY_REPORTS=true
SEND_BALANCE_ALERTS=true

# Umbrales configurables
LOW_BALANCE_THRESHOLD=1000
```

### **2. Inicialización**

El módulo se inicializa automáticamente al arrancar el servidor:

```typescript
// En index.ts
import { FinancialNotificationService } from "./services/FinancialNotificationService";

// Inicializar notificaciones financieras
FinancialNotificationService.getInstance();
```

### **3. Uso desde Frontend**

```typescript
// Ejemplo: Crear factura
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'sent',
    client: 'Cliente ABC',
    description: 'Servicios de consultoría',
    total: 5000,
    dueDate: '2025-02-15'
  })
});

// Ejemplo: Exportar reporte mensual a Excel (Solo Admin)
const exportExcel = async (year, month) => {
  const response = await fetch(`/api/financial-exports/monthly/${year}/${month}/excel`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Financiero_${month}_${year}.xlsx`;
    a.click();
  }
};

// Ejemplo: Obtener reportes disponibles
const getAvailableReports = async () => {
  const response = await fetch('/api/financial-exports/available', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return await response.json();
};
```

---

## 🧪 **Testing y Desarrollo**

### **Scripts Disponibles**

```bash
# Compilar TypeScript
npm run build

# Modo desarrollo
npm run dev

# Verificar errores
npm run type-check

# Tests (pendiente implementar)
npm test
```

### **Endpoints de Desarrollo**

- **Health Check**: `GET /health`
- **API Info**: `GET /`

---

## 🚀 **Deployment**

El módulo está totalmente integrado con la configuración existente de Railway/Render:

1. ✅ **Variables de entorno** configuradas
2. ✅ **Cron jobs** funcionando en producción
3. ✅ **Base de datos** MongoDB Atlas
4. ✅ **Emails** vía Brevo
5. ✅ **Logging** completo

---

## 📝 **Notas Importantes**

### **Migración de Datos**
- El sistema crea automáticamente los índices necesarios
- Los períodos se crean automáticamente al primer uso
- No requiere migración de datos existentes

### **Rendimiento**
- ✅ Índices optimizados en todos los modelos
- ✅ Agregaciones eficientes en reportes
- ✅ Paginación en todos los listados
- ✅ Validaciones en el backend y frontend

### **Mantenimiento**
- ✅ Logs detallados de todas las operaciones
- ✅ Manejo de errores robusto
- ✅ Recuperación automática de fallos
- ✅ Monitoreo de tareas programadas

---

## 🎯 **Próximas Mejoras**

1. **📊 Dashboard Frontend** - Gráficos interactivos
2. **📱 Notificaciones Push** - Alertas en tiempo real
3. ✅ **💾 Exportación** - PDF/Excel de reportes (IMPLEMENTADO)
4. **🔄 Sincronización** - APIs de bancos/contabilidad
5. **📈 BI Avanzado** - Análisis predictivo

---

## 🎉 **Nuevas Funcionalidades Implementadas**

### **📄 Sistema de Exportación de Reportes Financieros**

#### **Características Principales:**
- ✅ **Solo Administradores** - Acceso restringido con middleware `requireAdmin`
- ✅ **Reportes Mensuales Completos** - Datos detallados por mes
- ✅ **Doble Formato** - Excel (.xlsx) y PDF professional
- ✅ **Validación de Períodos** - No permite reportes futuros
- ✅ **5 Hojas en Excel**: Resumen, Facturas, Pagos, Cuentas, Flujo de Caja
- ✅ **PDF Ejecutivo** - Resumen visual con métricas clave

#### **Estructura de Datos del Reporte:**
```typescript
interface MonthlyReport {
  year: number;
  month: number;
  period: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    status: 'open' | 'closed';
  };
  summary: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalAccounts: number;
    totalBalance: number;
  };
  invoices: Array<Invoice>;
  payments: Array<Payment>;
  accounts: Array<Account>;
  cashFlow: Array<CashFlowData>;
}
```

#### **Endpoints Implementados:**
- `GET /api/financial-exports/available` - Lista de reportes disponibles
- `GET /api/financial-exports/monthly/:year/:month/data` - Datos JSON
- `GET /api/financial-exports/monthly/:year/:month/excel` - Descarga Excel
- `GET /api/financial-exports/monthly/:year/:month/pdf` - Descarga PDF

#### **Tecnologías Utilizadas:**
- **ExcelJS** - Generación de archivos Excel profesionales
- **Puppeteer** - Generación de PDF con HTML/CSS
- **Express Validator** - Validación de parámetros
- **Middleware de Roles** - Seguridad a nivel de admin

#### **Formatos de Archivo:**
- **Excel**: `Reporte_Financiero_Enero_2025.xlsx`
- **PDF**: `Reporte_Financiero_Enero_2025.pdf`

#### **Seguridad Implementada:**
- ✅ Autenticación JWT requerida
- ✅ Permisos de administrador obligatorios
- ✅ Validación de parámetros (año: 2020-2030, mes: 1-12)
- ✅ Prevención de reportes futuros
- ✅ Logging de accesos administrativos

---

**¡El módulo de gestión financiera está completamente implementado y listo para usar!** 🎉

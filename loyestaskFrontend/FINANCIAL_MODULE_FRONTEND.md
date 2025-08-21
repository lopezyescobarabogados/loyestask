# Módulo de Gestión Financiera - Frontend

## Descripción General

El módulo de gestión financiera del frontend proporciona una interfaz intuitiva y responsive para que los administradores puedan gestionar, visualizar y exportar reportes financieros detallados. El módulo está integrado completamente con el backend y sigue los patrones de diseño establecidos en el proyecto.

## Arquitectura y Estructura

### Componentes Principales

```
src/
├── components/financial/
│   ├── FinancialManagement.tsx      # Componente principal
│   ├── AvailableReportsTable.tsx   # Tabla de reportes disponibles
│   ├── MonthlyReportDetails.tsx    # Vista detallada de reportes
│   ├── YearSelector.tsx            # Selector de año con combobox
│   └── MonthSelector.tsx           # Selector de mes con combobox
├── views/financial/
│   └── FinancialView.tsx           # Vista principal con validación de admin
├── api/
│   └── FinancialAPI.ts             # Cliente API para servicios financieros
├── hooks/
│   └── useFinancialReports.ts      # Hook personalizado para gestión de datos
├── utils/
│   └── financialUtils.ts           # Utilidades de formateo y helpers
└── types/
    └── index.ts                    # Tipos TypeScript financieros
```

## Características Implementadas

### 🔐 Seguridad y Acceso
- **Acceso restringido**: Solo administradores pueden acceder al módulo
- **Validación de roles**: Implementada con el hook `useRole()`
- **Redirección automática**: Usuarios no autorizados son redirigidos

### 📊 Gestión de Reportes
- **Lista de reportes disponibles**: Vista tabular con filtros por año
- **Vista detallada**: Análisis completo de períodos específicos
- **Estadísticas en tiempo real**: Resúmenes financieros automáticos
- **Estados visuales**: Indicadores de disponibilidad de datos

### 📈 Visualización de Datos
- **Tarjetas de métricas**: Ingresos, gastos, ganancia neta y margen
- **Distribución por categorías**: Gráficos de barras con porcentajes
- **Tablas de facturas**: Estado, montos y fechas de vencimiento
- **Historial de pagos**: Registro cronológico de transacciones

### 💾 Exportación de Reportes
- **Formato Excel**: Reportes completos con múltiples hojas
- **Formato PDF**: Documentos profesionales para presentación
- **Descarga directa**: Generación y descarga automática de archivos
- **Nombres descriptivos**: Archivos con nomenclatura clara por período

### 🎨 Diseño Responsive
- **Mobile-first**: Optimizado para todos los dispositivos
- **Grid adaptativo**: Layouts que se ajustan automáticamente
- **Componentes flexibles**: Elementos que mantienen usabilidad en cualquier tamaño
- **Iconografía consistente**: Hero Icons para una experiencia uniforme

## Integración con el Sistema

### Router y Navegación
```typescript
// Rutas añadidas en router.tsx
<Route path='/admin/financial' element={<FinancialView />} />

// Enlace en NavMenu.tsx para administradores
<Link to='/admin/financial' className='block p-2 hover:text-blue-950'>
  Gestión Financiera
</Link>

// Tab adicional en AdminView.tsx
{
  name: 'Gestión Financiera',
  icon: CurrencyDollarIcon,
  component: FinancialManagement,
}
```

### API Integration
```typescript
// Endpoints utilizados
GET /api/financial-exports/available?year={year}
GET /api/financial-exports/monthly/{year}/{month}/data
GET /api/financial-exports/monthly/{year}/{month}/excel
GET /api/financial-exports/monthly/{year}/{month}/pdf
```

### Estado Global
- **React Query**: Gestión de estado del servidor con cache inteligente
- **Invalidación automática**: Refetch cuando cambian los filtros
- **Loading states**: Indicadores de carga en todas las operaciones
- **Error handling**: Manejo robusto de errores con toast notifications

## Tipos TypeScript

### Tipos Principales
```typescript
// Período financiero
type FinancialPeriod = {
  _id: string
  year: number
  month: number
  startDate: string
  endDate: string
  isActive: boolean
  isClosed: boolean
  totalIncome?: number
  totalExpenses?: number
  netProfit?: number
}

// Datos del reporte mensual
type MonthlyReportData = {
  period: FinancialPeriod
  summary: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
  incomeByCategory: CategoryData[]
  expensesByCategory: CategoryData[]
  invoices: InvoicesSummary
  payments: Payment[]
  accounts: Account[]
}

// Reporte disponible
type AvailableReport = {
  year: number
  month: number
  monthName: string
  periodId: string
  hasData: boolean
  totalIncome: number
  totalExpenses: number
  netProfit: number
}
```

## Patrones de Diseño Implementados

### 1. Composition Pattern
Los componentes están diseñados para ser composables y reutilizables:
```typescript
<FinancialManagement>
  <AvailableReportsTable />
  <MonthlyReportDetails />
</FinancialManagement>
```

### 2. Custom Hooks Pattern
Hook especializado para la lógica de negocio:
```typescript
const { 
  useAvailableReports, 
  useMonthlyReport, 
  downloadExcel, 
  downloadPDF 
} = useFinancialReports()
```

### 3. Container/Presentational Pattern
- **Container**: `FinancialView` maneja la lógica de autenticación
- **Presentational**: `FinancialManagement` se enfoca en la UI

### 4. Error Boundary Pattern
Manejo de errores a nivel de componente con fallbacks elegantes

## Estilos y Temas

### Paleta de Colores
- **Azul**: `blue-600` para acciones primarias y navegación
- **Verde**: `green-600` para ingresos y estados positivos
- **Rojo**: `red-600` para gastos y estados negativos
- **Gris**: `gray-*` para elementos neutros y backgrounds
- **Amarillo**: `yellow-600` para estados de advertencia

### Componentes UI
- **Tarjetas**: `bg-white shadow rounded-lg` para contenedores
- **Botones**: Estilos consistentes con el sistema de diseño
- **Tablas**: Headers con `bg-gray-50` y filas hover
- **Indicadores**: Badges con colores semánticos

## Performance y Optimización

### Caching Strategy
```typescript
// Cache de 5 minutos para reportes disponibles
staleTime: 5 * 60 * 1000

// Cache de 10 minutos para reportes detallados
staleTime: 10 * 60 * 1000
```

### Lazy Loading
- Componentes cargados solo cuando son necesarios
- Datos fetched bajo demanda con enabled queries
- Imágenes y assets optimizados

### Code Splitting
- Separación por rutas para optimal bundle size
- Dynamic imports para componentes pesados

## Testing Considerations

### Unit Tests
- Componentes individuales con diferentes props
- Hooks con mock data
- Utilidades de formateo

### Integration Tests
- Flujo completo de descarga de reportes
- Navegación entre vistas
- Validación de permisos de admin

### E2E Tests
- Escenarios completos de usuario
- Validación de archivos descargados
- Responsive behavior

## Deployment y Build

### Build Configuration
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### Environment Variables
```bash
VITE_API_URL=https://api.loyestask.com
```

## Mantenimiento y Extensibilidad

### Añadir Nuevas Características
1. Crear nuevos tipos en `types/index.ts`
2. Extender la API en `FinancialAPI.ts`
3. Actualizar el hook en `useFinancialReports.ts`
4. Implementar componentes UI nuevos
5. Integrar en el componente principal

### Mejoras Futuras
- **Gráficos interactivos**: Integración con Chart.js o Recharts
- **Filtros avanzados**: Por categorías, cuentas, tipos de pago
- **Exportación personalizada**: Selección de datos específicos
- **Dashboard financiero**: Vista resumida en la página principal
- **Notificaciones**: Alertas para fechas de vencimiento y metas

## Troubleshooting

### Problemas Comunes

1. **Error de permisos**: Verificar que el usuario tenga rol 'admin'
2. **Error de descarga**: Comprobar que el backend esté ejecutándose
3. **Datos no cargando**: Verificar conexión a la API
4. **Estilos rotos**: Asegurar que Tailwind esté configurado correctamente

### Debug Mode
```typescript
// Habilitar logs en desarrollo
if (import.meta.env.MODE === 'development') {
  console.log('Financial module debug info', data)
}
```

---

**Módulo desarrollado siguiendo las mejores prácticas de React, TypeScript y diseño responsive para LoyesTask.**

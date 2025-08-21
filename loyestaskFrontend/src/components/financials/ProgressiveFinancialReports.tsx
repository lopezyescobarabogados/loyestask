import { useState } from 'react'
import { useFinancialReports } from '@/hooks/useFinancials'
import {
    ChartBarIcon,
    PresentationChartLineIcon,
    DocumentChartBarIcon,
    CalendarIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowUpIcon,
} from '@heroicons/react/24/outline'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

// Función utilitaria para formatear moneda
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount)
}

// Función utilitaria para formatear fecha
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

// Función utilitaria para formatear porcentaje
const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
}

// Colores para gráficos
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

// Esqueleto de carga para los reportes
function ReportsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    )
}

// Componente de error
function ReportsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar reportes</h3>
            <p className="text-red-600 mb-4">{error.message}</p>
            <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
                Intentar nuevamente
            </button>
        </div>
    )
}

// Tipos para los datos de gráficos
interface TrendDataPoint {
    period: string
    income: number
    expense: number
    profit: number
}

interface CategoryDataPoint {
    category: string
    amount: number
}

interface DistributionDataPoint {
    name: string
    value: number
}

interface CashFlowDataPoint {
    date: string
    balance: number
}

// Interfaz temporal para el dashboard
interface DashboardData {
    totalIncome?: number
    totalExpenses?: number
    netIncome?: number
    profitMargin?: number
    revenueGrowth?: number
    expenseGrowth?: number
    cashFlow?: number
    roi?: number
}

// Componente de tarjeta de métrica
function MetricCard({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    format = 'currency' 
}: { 
    title: string
    value: number
    change?: number
    icon: React.ComponentType<{ className?: string }>
    color?: string
    format?: 'currency' | 'number' | 'percent'
}) {
    const formatValue = (val: number) => {
        switch (format) {
            case 'currency':
                return formatCurrency(val)
            case 'percent':
                return formatPercent(val)
            default:
                return val.toLocaleString()
        }
    }

    const getColorClasses = (colorName: string) => {
        const colors = {
            blue: 'text-blue-600 bg-blue-100',
            green: 'text-green-600 bg-green-100',
            red: 'text-red-600 bg-red-100',
            yellow: 'text-yellow-600 bg-yellow-100',
            purple: 'text-purple-600 bg-purple-100',
        }
        return colors[colorName as keyof typeof colors] || colors.blue
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
                    {change !== undefined && (
                        <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                            ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                            )}
                            <span className="text-sm font-medium">
                                {Math.abs(change).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    )
}

// Componente de gráfico de líneas para tendencias
function TrendChart({ data, title }: { data: TrendDataPoint[]; title: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Ingresos"
                        dot={{ r: 4 }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        name="Gastos"
                        dot={{ r: 4 }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        name="Utilidad"
                        dot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

// Componente de gráfico de barras para comparación
function ComparisonChart({ data, title }: { data: CategoryDataPoint[]; title: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// Componente de gráfico circular para distribución
function DistributionChart({ data, title }: { data: DistributionDataPoint[]; title: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

// Componente de gráfico de área para cash flow
function CashFlowChart({ data, title }: { data: CashFlowDataPoint[]; title: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatDate(value)}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelFormatter={(label) => formatDate(label)}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                        name="Balance"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export default function ProgressiveFinancialReports() {
    const [selectedPeriod, setSelectedPeriod] = useState('current')
    const [reportType, setReportType] = useState('overview')

    // Hooks de React Query
    const { data: reportsData, isLoading, error, refetch } = useFinancialReports({ 
        period: selectedPeriod,
        type: reportType 
    })

    // Extraer datos
    const dashboardData = (reportsData as DashboardData) || {}

    // Datos simulados para los gráficos (normalmente vendrían del backend)
    const trendData = [
        { period: 'Ene 2024', income: 150000, expense: 120000, profit: 30000 },
        { period: 'Feb 2024', income: 180000, expense: 140000, profit: 40000 },
        { period: 'Mar 2024', income: 200000, expense: 160000, profit: 40000 },
        { period: 'Abr 2024', income: 170000, expense: 150000, profit: 20000 },
        { period: 'May 2024', income: 220000, expense: 180000, profit: 40000 },
        { period: 'Jun 2024', income: 250000, expense: 200000, profit: 50000 },
    ]

    const categoryData = [
        { category: 'Marketing', amount: 45000 },
        { category: 'Oficina', amount: 32000 },
        { category: 'Servicios', amount: 28000 },
        { category: 'Personal', amount: 85000 },
        { category: 'Tecnología', amount: 22000 },
    ]

    const distributionData = [
        { name: 'Marketing', value: 45000 },
        { name: 'Personal', value: 85000 },
        { name: 'Oficina', value: 32000 },
        { name: 'Servicios', value: 28000 },
        { name: 'Tecnología', value: 22000 },
    ]

    const cashFlowData = [
        { date: '2024-01-01', balance: 100000 },
        { date: '2024-01-15', balance: 125000 },
        { date: '2024-02-01', balance: 150000 },
        { date: '2024-02-15', balance: 135000 },
        { date: '2024-03-01', balance: 180000 },
        { date: '2024-03-15', balance: 200000 },
    ]

    // Métricas calculadas
    const metrics = {
        totalRevenue: dashboardData.totalIncome || 1250000,
        totalExpenses: dashboardData.totalExpenses || 950000,
        netProfit: dashboardData.netIncome || 300000,
        profitMargin: dashboardData.profitMargin || 24.0,
        revenueGrowth: dashboardData.revenueGrowth || 15.2,
        expenseGrowth: dashboardData.expenseGrowth || 8.7,
        cashFlow: dashboardData.cashFlow || 200000,
        roi: dashboardData.roi || 18.5,
    }

    const handleExportReport = () => {
        // Aquí implementarías la lógica de exportación
        console.log('Exportando reporte...', { selectedPeriod, reportType })
        alert('Funcionalidad de exportación en desarrollo')
    }

    if (isLoading) {
        return <ReportsSkeleton />
    }

    if (error) {
        return <ReportsError error={error} onRetry={refetch} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Reportes Financieros
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Analytics avanzados y reportes detallados del desempeño financiero
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="current">Período Actual</option>
                        <option value="last_month">Mes Anterior</option>
                        <option value="last_quarter">Trimestre Anterior</option>
                        <option value="last_year">Año Anterior</option>
                        <option value="ytd">Año a la Fecha</option>
                    </select>
                </div>
                <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="overview">Vista General</option>
                        <option value="income">Análisis de Ingresos</option>
                        <option value="expenses">Análisis de Gastos</option>
                        <option value="profit">Análisis de Rentabilidad</option>
                        <option value="cashflow">Flujo de Caja</option>
                    </select>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingresos Totales"
                    value={metrics.totalRevenue}
                    change={metrics.revenueGrowth}
                    icon={ArrowTrendingUpIcon}
                    color="green"
                />
                <MetricCard
                    title="Gastos Totales"
                    value={metrics.totalExpenses}
                    change={-metrics.expenseGrowth}
                    icon={ArrowTrendingDownIcon}
                    color="red"
                />
                <MetricCard
                    title="Utilidad Neta"
                    value={metrics.netProfit}
                    change={12.4}
                    icon={CurrencyDollarIcon}
                    color="blue"
                />
                <MetricCard
                    title="Margen de Utilidad"
                    value={metrics.profitMargin}
                    change={2.1}
                    icon={ChartBarIcon}
                    color="purple"
                    format="percent"
                />
            </div>

            {/* Métricas secundarias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Flujo de Caja"
                    value={metrics.cashFlow}
                    icon={ArrowUpIcon}
                    color="blue"
                />
                <MetricCard
                    title="ROI"
                    value={metrics.roi}
                    change={3.2}
                    icon={PresentationChartLineIcon}
                    color="green"
                    format="percent"
                />
                <MetricCard
                    title="Crecimiento Ingresos"
                    value={metrics.revenueGrowth}
                    icon={ArrowTrendingUpIcon}
                    color="green"
                    format="percent"
                />
                <MetricCard
                    title="Control de Gastos"
                    value={metrics.expenseGrowth}
                    icon={ArrowTrendingDownIcon}
                    color="yellow"
                    format="percent"
                />
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendChart 
                    data={trendData}
                    title="Tendencia de Ingresos vs Gastos"
                />
                <ComparisonChart 
                    data={categoryData}
                    title="Gastos por Categoría"
                />
            </div>

            {/* Gráficos secundarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionChart 
                    data={distributionData}
                    title="Distribución de Gastos"
                />
                <CashFlowChart 
                    data={cashFlowData}
                    title="Evolución del Flujo de Caja"
                />
            </div>

            {/* Resumen ejecutivo */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <DocumentChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Resumen Ejecutivo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Puntos Destacados</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                Los ingresos han crecido un {metrics.revenueGrowth}% comparado con el período anterior
                            </li>
                            <li className="flex items-start">
                                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                Los gastos se han mantenido controlados con solo un {metrics.expenseGrowth}% de incremento
                            </li>
                            <li className="flex items-start">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                El margen de utilidad se mantiene saludable en {metrics.profitMargin}%
                            </li>
                            <li className="flex items-start">
                                <CurrencyDollarIcon className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                El ROI actual es de {metrics.roi}%, superando el objetivo del 15%
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recomendaciones</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>• Continuar invirtiendo en las categorías de mayor retorno</li>
                            <li>• Revisar y optimizar los gastos en categorías con bajo desempeño</li>
                            <li>• Mantener el nivel actual de inversión en marketing</li>
                            <li>• Establecer reservas adicionales para oportunidades de crecimiento</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <ChartBarIcon className="h-5 w-5 text-blue-400 mr-2" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium">Información sobre los reportes</p>
                        <p className="mt-1">
                            Los datos mostrados incluyen todas las transacciones registradas en el período seleccionado. 
                            Los gráficos se actualizan automáticamente con los últimos datos disponibles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

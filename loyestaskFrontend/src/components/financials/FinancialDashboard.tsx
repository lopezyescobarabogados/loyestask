import { useMemo } from 'react'
import { 
    useFinancialDashboard, 
    useAccountsReceivableReport,
    useIncomeProjectionReport 
} from '@/hooks/useFinancialReports'
import { useCurrentFinancialPeriod } from '@/hooks/useFinancialPeriods'
import { formatCurrency, formatPercentage } from '@/utils/financialUtils'
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface FinancialDashboardProps {
    year?: number
    month?: number
    period?: string
}

export default function FinancialDashboard({ year, month, period }: FinancialDashboardProps) {
    const { data: currentPeriod } = useCurrentFinancialPeriod()
    const { data: dashboard, isLoading, error } = useFinancialDashboard({ year, month, period })
    const { data: accountsReceivable } = useAccountsReceivableReport()
    const { data: incomeProjection } = useIncomeProjectionReport({ months: 3 })

    // Calcular métricas adicionales
    const metrics = useMemo(() => {
        if (!dashboard) return null

        const netIncome = dashboard.netIncome
        const previousNetIncome = netIncome * 0.9 // Simulated previous period for demo
        const incomeChange = previousNetIncome === 0 ? 0 : ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100
        
        return {
            netIncome,
            incomeChange,
            profitMargin: dashboard.totalIncome > 0 ? (netIncome / dashboard.totalIncome) * 100 : 0,
            overdueAmount: accountsReceivable?.aging.over90 || 0,
            projectedGrowth: incomeProjection?.summary.confidence || 0
        }
    }, [dashboard, accountsReceivable, incomeProjection])

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-lg shadow p-6">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error al cargar el dashboard
                            </h3>
                            <p className="mt-1 text-sm text-red-700">
                                {error instanceof Error ? error.message : 'Error desconocido'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!dashboard || !metrics) {
        return (
            <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay datos disponibles
                    </h3>
                    <p className="text-gray-600">
                        No se encontraron datos financieros para el período seleccionado.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
                    {currentPeriod && (
                        <p className="text-sm text-gray-600">
                            Período actual: {currentPeriod.month}/{currentPeriod.year}
                        </p>
                    )}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Income */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboard.totalIncome)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboard.totalExpenses)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Net Income */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {metrics.incomeChange >= 0 ? (
                                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                            ) : (
                                <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
                            )}
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Ingresos Netos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(metrics.netIncome)}
                            </p>
                            <p className={`text-sm ${metrics.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.incomeChange >= 0 ? '+' : ''}{formatPercentage(metrics.incomeChange)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Accounts Balance */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Balance Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboard.accountsBalance)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invoices Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Facturas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total</span>
                            <span className="text-sm font-medium">{dashboard.totalInvoices}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pendientes</span>
                            <span className="text-sm font-medium text-yellow-600">
                                {dashboard.pendingInvoices}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Vencidas</span>
                            <span className="text-sm font-medium text-red-600">
                                {dashboard.overdueInvoices}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Profit Margin */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Rentabilidad</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Margen de Ganancia</span>
                            <span className="text-sm font-medium">
                                {formatPercentage(metrics.profitMargin)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Proyección de Crecimiento</span>
                            <span className="text-sm font-medium text-green-600">
                                {formatPercentage(metrics.projectedGrowth)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas</h3>
                    <div className="space-y-3">
                        {dashboard.overdueInvoices > 0 && (
                            <div className="flex items-center text-red-600">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                    {dashboard.overdueInvoices} facturas vencidas
                                </span>
                            </div>
                        )}
                        {metrics.overdueAmount > 0 && (
                            <div className="flex items-center text-red-600">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                    {formatCurrency(metrics.overdueAmount)} por cobrar atrasado
                                </span>
                            </div>
                        )}
                        {dashboard.overdueInvoices === 0 && metrics.overdueAmount === 0 && (
                            <div className="flex items-center text-green-600">
                                <span className="text-sm">Sin alertas pendientes</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Clients and Expense Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Principales Clientes</h3>
                    {dashboard.topClients.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.topClients.map((client, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.invoices} facturas</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatCurrency(client.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No hay datos de clientes disponibles</p>
                    )}
                </div>

                {/* Expense Categories */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos por Categoría</h3>
                    {dashboard.expensesByCategory.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.expensesByCategory.map((category, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-medium text-gray-900">{category.category}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatPercentage(category.percentage)}
                                            </p>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${category.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 ml-4">
                                        {formatCurrency(category.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No hay datos de categorías disponibles</p>
                    )}
                </div>
            </div>
        </div>
    )
}

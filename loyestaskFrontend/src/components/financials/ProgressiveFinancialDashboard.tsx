import { useState } from 'react'
import { useFinancialDashboard } from '@/hooks/useFinancials'
import {
    CurrencyDollarIcon,
    DocumentTextIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// Función utilitaria para formatear moneda
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount)
}

// Esqueleto de carga para el dashboard
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-200 h-64 rounded-lg"></div>
                <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
        </div>
    )
}

// Componente de error
function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar dashboard financiero</h3>
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

export default function ProgressiveFinancialDashboard() {
    const [period] = useState('monthly')
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const { data: dashboard, isLoading, error, refetch } = useFinancialDashboard({ period })

    // Datos por defecto mientras se cargan los reales
    const defaultData = {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalPayments: 0,
        accountsBalance: 0,
        monthlyIncome: [],
        topClients: [],
        expensesByCategory: []
    }

    const dashboardData = dashboard || defaultData

    // Configuración de las tarjetas principales
    const cards = [
        {
            title: 'Ingresos Totales',
            value: formatCurrency(dashboardData.totalIncome),
            icon: ArrowTrendingUpIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Gastos Totales',
            value: formatCurrency(dashboardData.totalExpenses),
            icon: ArrowTrendingDownIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Ingresos Netos',
            value: formatCurrency(dashboardData.netIncome),
            icon: CurrencyDollarIcon,
            color: dashboardData.netIncome >= 0 ? 'text-green-600' : 'text-red-600',
            bgColor: dashboardData.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50',
        },
        {
            title: 'Total de Pagos',
            value: formatCurrency(dashboardData.totalPayments),
            icon: DocumentTextIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
    ]

    if (isLoading) {
        return <DashboardSkeleton />
    }

    if (error) {
        return <DashboardError error={error} onRetry={refetch} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Dashboard Financiero
                </h3>
                <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Vista general del estado financiero {period && `- ${period}`}
                </p>
            </div>

            {/* Tarjetas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className={`text-2xl font-semibold ${card.color}`}>
                                    {card.value}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gráficos y información adicional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Facturas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Facturas Pendientes</span>
                            <span className="text-orange-600 font-medium">{dashboardData.pendingInvoices}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Facturas Vencidas</span>
                            <span className="text-red-600 font-medium">{dashboardData.overdueInvoices}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Cuentas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total de Facturas</span>
                            <span className="font-medium">{dashboardData.totalInvoices}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Balance de Cuentas</span>
                            <span className={`font-medium ${
                                dashboardData.accountsBalance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {formatCurrency(dashboardData.accountsBalance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Período</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{year}</div>
                        <div className="text-sm text-gray-500">Año</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{month}</div>
                        <div className="text-sm text-gray-500">Mes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{period}</div>
                        <div className="text-sm text-gray-500">Período</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
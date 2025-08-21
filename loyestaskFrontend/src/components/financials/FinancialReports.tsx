import { useState } from 'react'
import {
    ChartBarIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '../../utils/financialUtils'

const REPORT_TYPES = [
    { value: 'summary', label: 'Resumen Financiero' },
    { value: 'cash_flow', label: 'Flujo de Caja' },
    { value: 'accounts', label: 'Estado de Cuentas' },
    { value: 'payments', label: 'Reporte de Pagos' },
    { value: 'invoices', label: 'Reporte de Facturas' }
]

const PERIODS = [
    { value: 'current_month', label: 'Mes Actual' },
    { value: 'last_month', label: 'Mes Anterior' },
    { value: 'current_quarter', label: 'Trimestre Actual' },
    { value: 'last_quarter', label: 'Trimestre Anterior' },
    { value: 'current_year', label: 'Año Actual' },
    { value: 'last_year', label: 'Año Anterior' },
    { value: 'custom', label: 'Período Personalizado' }
]

export default function FinancialReports() {
    const [selectedReport, setSelectedReport] = useState('summary')
    const [selectedPeriod, setSelectedPeriod] = useState('current_month')
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    })
    const [isLoading] = useState(false)

    // Mock data for demonstration
    const mockSummary = {
        totalIncome: 125000,
        totalExpenses: 85000,
        netIncome: 40000,
        totalBalance: 250000
    }

    const handleExportReport = (format: 'pdf' | 'excel') => {
        console.log(`Exporting ${selectedReport} report as ${format}`)
    }

    const renderSummaryReport = () => {
        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Ingresos Totales
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {formatCurrency(mockSummary.totalIncome)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Gastos Totales
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {formatCurrency(mockSummary.totalExpenses)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ArrowTrendingUpIcon className={`h-6 w-6 ${mockSummary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Utilidad Neta
                                        </dt>
                                        <dd className={`text-lg font-medium ${mockSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(mockSummary.netIncome)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Balance Total
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {formatCurrency(mockSummary.totalBalance)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Ingresos vs Gastos</h3>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <p className="text-gray-500">Gráfico de barras próximamente</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Cuentas</h3>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <p className="text-gray-500">Gráfico circular próximamente</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderTableReport = (title: string) => {
        return (
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {title}
                    </h3>
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Los datos de {title.toLowerCase()} se mostrarán aquí cuando estén disponibles.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const renderReportContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                </div>
            )
        }

        switch (selectedReport) {
            case 'summary':
                return renderSummaryReport()
            case 'cash_flow':
                return renderTableReport('Flujo de Caja')
            case 'accounts':
                return renderTableReport('Estado de Cuentas')
            case 'payments':
                return renderTableReport('Reporte de Pagos')
            case 'invoices':
                return renderTableReport('Reporte de Facturas')
            default:
                return <div className="text-center py-12 text-gray-500">Selecciona un tipo de reporte</div>
        }
    }

    return (
        <div className="space-y-6">
            {/* Report Controls */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Reporte
                        </label>
                        <select
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {REPORT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {PERIODS.map(period => (
                                <option key={period.value} value={period.value}>
                                    {period.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={() => handleExportReport('pdf')}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            PDF
                        </button>
                        <button
                            onClick={() => handleExportReport('excel')}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Excel
                        </button>
                    </div>
                </div>

                {/* Custom Date Range */}
                {selectedPeriod === 'custom' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={customDateRange.startDate}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                value={customDateRange.endDate}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Report Content */}
            {renderReportContent()}
        </div>
    )
}

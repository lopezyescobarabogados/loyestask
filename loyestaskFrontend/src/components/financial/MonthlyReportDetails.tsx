import { 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    ArrowTrendingUpIcon, 
    ArrowTrendingDownIcon,
    DocumentTextIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline'
import { type MonthlyReportData } from '@/types/index'

interface MonthlyReportDetailsProps {
    reportData: MonthlyReportData
    loading?: boolean
}

export default function MonthlyReportDetails({ reportData, loading = false }: MonthlyReportDetailsProps) {
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatPercentage = (percentage: number) => {
        return `${percentage.toFixed(1)}%`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'overdue':
                return 'bg-red-100 text-red-800'
            case 'cancelled':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid':
                return 'Pagada'
            case 'pending':
                return 'Pendiente'
            case 'overdue':
                return 'Vencida'
            case 'cancelled':
                return 'Cancelada'
            default:
                return status
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded mb-6"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    const { period, summary, incomeByCategory, expensesByCategory, invoices, payments } = reportData

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Reporte Financiero - {new Date(period.startDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Período: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            period.isClosed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                            {period.isClosed ? 'Cerrado' : 'Activo'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Resumen financiero */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                            <p className="text-2xl font-semibold text-green-600">
                                {formatCurrency(summary.totalIncome)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
                            <p className="text-2xl font-semibold text-red-600">
                                {formatCurrency(summary.totalExpenses)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CurrencyDollarIcon className={`h-8 w-8 ${summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Ganancia Neta</p>
                            <p className={`text-2xl font-semibold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.netProfit)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Margen de Ganancia</p>
                            <p className={`text-2xl font-semibold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(summary.profitMargin)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Distribución por categorías */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingresos por categoría */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ingresos por Categoría</h3>
                    <div className="space-y-3">
                        {incomeByCategory.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">{category.category}</span>
                                        <span className="text-gray-500">{formatPercentage(category.percentage)}</span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full" 
                                            style={{ width: `${category.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1 text-sm text-green-600 font-medium">
                                        {formatCurrency(category.amount)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gastos por categoría */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos por Categoría</h3>
                    <div className="space-y-3">
                        {expensesByCategory.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">{category.category}</span>
                                        <span className="text-gray-500">{formatPercentage(category.percentage)}</span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full" 
                                            style={{ width: `${category.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1 text-sm text-red-600 font-medium">
                                        {formatCurrency(category.amount)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resumen de facturas */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Resumen de Facturas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-900">{invoices.total}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-green-600">{invoices.paid}</p>
                        <p className="text-sm text-gray-500">Pagadas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-yellow-600">{invoices.pending}</p>
                        <p className="text-sm text-gray-500">Pendientes</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-red-600">{invoices.overdue}</p>
                        <p className="text-sm text-gray-500">Vencidas</p>
                    </div>
                </div>

                {/* Lista de facturas */}
                {invoices.details.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vencimiento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.details.slice(0, 10).map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.client}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {getStatusText(invoice.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Últimos pagos */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Últimos Pagos ({payments.length})
                </h3>
                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.slice(0, 10).map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                payment.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {payment.type === 'income' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`text-sm font-medium ${
                                                payment.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {payment.type === 'income' ? '+' : '-'}{formatCurrency(payment.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay pagos registrados en este período</p>
                    </div>
                )}
            </div>
        </div>
    )
}

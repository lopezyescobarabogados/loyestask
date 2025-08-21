import { ArrowDownTrayIcon, DocumentIcon, TableCellsIcon, CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { type AvailableReport } from '@/types/index'

interface AvailableReportsTableProps {
    reports: AvailableReport[]
    onDownloadExcel: (year: number, month: number) => void
    onDownloadPDF: (year: number, month: number) => void
    onViewDetails: (year: number, month: number) => void
    loading?: boolean
}

export default function AvailableReportsTable({ 
    reports, 
    onDownloadExcel, 
    onDownloadPDF, 
    onViewDetails,
    loading = false 
}: AvailableReportsTableProps) {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getProfitIcon = (netProfit: number) => {
        if (netProfit > 0) {
            return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
        } else if (netProfit < 0) {
            return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
        }
        return null
    }

    const getProfitTextColor = (netProfit: number) => {
        if (netProfit > 0) return 'text-green-600'
        if (netProfit < 0) return 'text-red-600'
        return 'text-gray-600'
    }

    if (loading) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay reportes disponibles
                    </h3>
                    <p className="text-gray-500">
                        No se encontraron reportes financieros para el período seleccionado.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                    Reportes Financieros Disponibles
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {reports.length} reporte{reports.length !== 1 ? 's' : ''} encontrado{reports.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Período
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ingresos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gastos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ganancia Neta
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={`${report.year}-${report.month}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {report.monthName} {report.year}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {report.month.toString().padStart(2, '0')}/{report.year}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-green-600">
                                        {formatCurrency(report.totalIncome)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-red-600">
                                        {formatCurrency(report.totalExpenses)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm font-medium flex items-center gap-1 ${getProfitTextColor(report.netProfit)}`}>
                                        {getProfitIcon(report.netProfit)}
                                        {formatCurrency(report.netProfit)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        report.hasData 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {report.hasData ? 'Datos disponibles' : 'Sin datos'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {report.hasData ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewDetails(report.year, report.month)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                                title="Ver detalles"
                                            >
                                                <DocumentIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => onDownloadExcel(report.year, report.month)}
                                                className="text-green-600 hover:text-green-900 transition-colors duration-200"
                                                title="Descargar Excel"
                                            >
                                                <TableCellsIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => onDownloadPDF(report.year, report.month)}
                                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                title="Descargar PDF"
                                            >
                                                <ArrowDownTrayIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Sin acciones</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

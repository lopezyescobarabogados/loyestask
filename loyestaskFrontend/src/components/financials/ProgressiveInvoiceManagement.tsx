import { useState } from 'react'
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices'
import {
    DocumentTextIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import type { Invoice, CreateInvoiceForm } from '@/types/index'

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

// Función utilitaria para obtener color del estado
const getStatusColor = (status: string) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

// Función utilitaria para traducir estados
const getStatusLabel = (status: string) => {
    const labels = {
        draft: 'Borrador',
        sent: 'Enviada',
        paid: 'Pagada',
        overdue: 'Vencida',
        cancelled: 'Cancelada',
    }
    return labels[status as keyof typeof labels] || status
}

// Esqueleto de carga para las facturas
function InvoicesSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    )
}

// Componente de error
function InvoicesError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar facturas</h3>
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

// Modal simple para crear/editar factura
function InvoiceModal({ 
    isOpen, 
    onClose, 
    invoice = null,
    onSave 
}: { 
    isOpen: boolean
    onClose: () => void
    invoice?: Invoice | null
    onSave: (data: CreateInvoiceForm) => void 
}) {
    const [formData, setFormData] = useState({
        invoiceNumber: invoice?.invoiceNumber || '',
        client: invoice?.client || '',
        description: invoice?.description || '',
        total: invoice?.total || 0,
        dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        type: invoice?.type || 'sent' as const,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                    {invoice ? 'Editar Factura' : 'Nueva Factura'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Factura
                        </label>
                        <input
                            type="text"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cliente
                        </label>
                        <input
                            type="text"
                            value={formData.client}
                            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={3}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.total}
                            onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Vencimiento
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {invoice ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ProgressiveInvoiceManagement() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

    // Hooks de React Query
    const { data: invoicesData, isLoading, error, refetch } = useInvoices()
    const createInvoiceMutation = useCreateInvoice()
    const updateInvoiceMutation = useUpdateInvoice()
    const deleteInvoiceMutation = useDeleteInvoice()

    // Extraer array de facturas
    const invoices = invoicesData?.invoices || []

    // Filtrar facturas
    const filteredInvoices = invoices.filter((invoice: Invoice) => {
        const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = !statusFilter || invoice.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Handlers
    const handleCreateInvoice = (data: CreateInvoiceForm) => {
        createInvoiceMutation.mutate(data, {
            onSuccess: () => {
                refetch()
                setShowModal(false)
            }
        })
    }

    const handleUpdateInvoice = (data: CreateInvoiceForm) => {
        if (editingInvoice) {
            updateInvoiceMutation.mutate({ 
                id: editingInvoice._id, 
                data 
            }, {
                onSuccess: () => {
                    refetch()
                    setEditingInvoice(null)
                    setShowModal(false)
                }
            })
        }
    }

    const handleDeleteInvoice = (invoice: Invoice) => {
        if (confirm(`¿Estás seguro de eliminar la factura ${invoice.invoiceNumber}?`)) {
            deleteInvoiceMutation.mutate(invoice._id, {
                onSuccess: () => {
                    refetch()
                }
            })
        }
    }

    const handleEditInvoice = (invoice: Invoice) => {
        setEditingInvoice(invoice)
        setShowModal(true)
    }

    if (isLoading) {
        return <InvoicesSkeleton />
    }

    if (error) {
        return <InvoicesError error={error} onRetry={refetch} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Gestión de Facturas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra todas las facturas enviadas y recibidas
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingInvoice(null)
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Factura
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o número de factura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="sent">Enviada</option>
                        <option value="paid">Pagada</option>
                        <option value="overdue">Vencida</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                </div>
            </div>

            {/* Lista de facturas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vencimiento
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        {searchTerm || statusFilter ? 'No se encontraron facturas con los filtros aplicados' : 'No hay facturas registradas'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice: Invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {invoice.invoiceNumber}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {invoice.description?.substring(0, 50)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {invoice.client}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(invoice.dueDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditInvoice(invoice)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="Editar"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInvoice(invoice)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total de Facturas</div>
                    <div className="text-2xl font-bold text-gray-900">{invoices.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Facturas Enviadas</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {invoices.filter((inv: Invoice) => inv.status === 'sent').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Facturas Pagadas</div>
                    <div className="text-2xl font-bold text-green-600">
                        {invoices.filter((inv: Invoice) => inv.status === 'paid').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Facturas Vencidas</div>
                    <div className="text-2xl font-bold text-red-600">
                        {invoices.filter((inv: Invoice) => inv.status === 'overdue').length || 0}
                    </div>
                </div>
            </div>

            {/* Modal para crear/editar */}
            <InvoiceModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setEditingInvoice(null)
                }}
                invoice={editingInvoice}
                onSave={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
            />
        </div>
    )
}

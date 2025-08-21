import { useState, Fragment } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Dialog, Transition, Menu, DialogPanel, TransitionChild, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon,
    FunnelIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { useInvoices, useDeleteInvoice, useUpdateInvoiceStatus } from '../../hooks/useInvoices'
import { formatCurrency } from '../../utils/financialUtils'
import type { Invoice } from '../../types'
import InvoiceForm from './InvoiceForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const INVOICE_STATUSES = [
    { value: 'draft', label: 'Borrador' },
    { value: 'sent', label: 'Enviada' },
    { value: 'paid', label: 'Pagada' },
    { value: 'overdue', label: 'Vencida' },
    { value: 'cancelled', label: 'Cancelada' }
]

const INVOICE_TYPES = [
    { value: 'sent', label: 'Enviada' },
    { value: 'received', label: 'Recibida' }
]

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800'
    }
    
    const statusLabels = {
        draft: 'Borrador',
        sent: 'Enviada',
        paid: 'Pagada',
        overdue: 'Vencida',
        cancelled: 'Cancelada'
    }
    
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[status as keyof typeof statusConfig] || statusConfig.draft}`}>
            {statusLabels[status as keyof typeof statusLabels] || status}
        </span>
    )
}

export default function InvoiceManagement() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const {
        data: invoicesData,
        isLoading,
        error
    } = useInvoices({
        search: searchTerm,
        status: statusFilter || undefined,
        type: typeFilter as 'sent' | 'received' | undefined
    })

    const deleteInvoice = useDeleteInvoice()
    const updateInvoiceStatus = useUpdateInvoiceStatus()

    const invoices = invoicesData?.invoices || []

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        if (value) {
            searchParams.set('search', value)
        } else {
            searchParams.delete('search')
        }
        setSearchParams(searchParams)
    }

    const handleStatusChange = async (invoiceId: string, newStatus: string) => {
        try {
            await updateInvoiceStatus.mutateAsync({ 
                id: invoiceId, 
                status: newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
            })
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleDelete = async (invoiceId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
            try {
                await deleteInvoice.mutateAsync(invoiceId)
            } catch (error) {
                console.error('Error deleting invoice:', error)
            }
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('')
        setTypeFilter('')
        setSearchParams({})
    }

    const hasActiveFilters = searchTerm || statusFilter || typeFilter

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                    Error al cargar las facturas: {error.message}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Gestión de Facturas
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra todas las facturas del sistema
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar facturas..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                                {[searchTerm, statusFilter, typeFilter].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="">Todos los estados</option>
                                    {INVOICE_STATUSES.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="">Todos los tipos</option>
                                    {INVOICE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <XMarkIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Cargando facturas...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        No hay facturas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {hasActiveFilters 
                            ? 'No se encontraron facturas con los filtros aplicados.'
                            : 'Comienza creando una nueva factura.'
                        }
                    </p>
                    {!hasActiveFilters && (
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                                Nueva Factura
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vencimiento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {invoice.invoiceNumber}
                                                </div>
                                                {invoice.project && (
                                                    <div className="text-sm text-gray-500">
                                                        {invoice.project}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {invoice.client}
                                            </div>
                                            {invoice.provider && (
                                                <div className="text-sm text-gray-500">
                                                    Proveedor: {invoice.provider}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.type === 'sent' ? 'Enviada' : 'Recibida'}
                                        </td>
                                        <td className="relative px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <MenuButton className="flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                                                    <span className="sr-only">Abrir opciones</span>
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </MenuButton>

                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="py-1">
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <Link
                                                                        to={`/dashboard/financials/invoices/${invoice._id}`}
                                                                        className={`${
                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                        } group flex items-center px-4 py-2 text-sm`}
                                                                    >
                                                                        <EyeIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                        Ver detalles
                                                                    </Link>
                                                                )}
                                                            </MenuItem>
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => setEditingInvoice(invoice)}
                                                                        className={`${
                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                        } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                                                    >
                                                                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                        Editar
                                                                    </button>
                                                                )}
                                                            </MenuItem>

                                                            {/* Status Change Options */}
                                                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                                                <>
                                                                    <MenuItem>
                                                                        {({ active }) => (
                                                                            <button
                                                                                onClick={() => handleStatusChange(invoice._id, 'paid')}
                                                                                className={`${
                                                                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                                } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                                                            >
                                                                                Marcar como pagada
                                                                            </button>
                                                                        )}
                                                                    </MenuItem>
                                                                    <MenuItem>
                                                                        {({ active }) => (
                                                                            <button
                                                                                onClick={() => handleStatusChange(invoice._id, 'sent')}
                                                                                className={`${
                                                                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                                } group flex w-full items-center px-4 py-2 text-left text-sm`}
                                                                            >
                                                                                Marcar como enviada
                                                                            </button>
                                                                        )}
                                                                    </MenuItem>
                                                                </>
                                                            )}

                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleDelete(invoice._id)}
                                                                        className={`${
                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                                        } group flex w-full items-center px-4 py-2 text-left text-sm text-red-700`}
                                                                    >
                                                                        <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                                                                        Eliminar
                                                                    </button>
                                                                )}
                                                            </MenuItem>
                                                        </div>
                                                    </MenuItems>
                                                </Transition>
                                            </Menu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            <Transition show={isCreateModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setIsCreateModalOpen}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                    <InvoiceForm
                                        onClose={() => setIsCreateModalOpen(false)}
                                        onSuccess={() => setIsCreateModalOpen(false)}
                                    />
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Edit Invoice Modal */}
            <Transition show={!!editingInvoice} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setEditingInvoice(null)}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                    {editingInvoice && (
                                        <InvoiceForm
                                            invoice={editingInvoice}
                                            onClose={() => setEditingInvoice(null)}
                                            onSuccess={() => setEditingInvoice(null)}
                                        />
                                    )}
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}
